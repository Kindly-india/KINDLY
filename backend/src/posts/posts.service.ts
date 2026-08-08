import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { removeFromStorage } from '../common/storage.util';

@Injectable()
export class PostsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- CREATE POST ---
  async createPost(userId: string, dto: CreatePostDto) {
    const client = this.supabase.getClient();

    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) throw new ForbiddenException('Volunteer profile not found');

    // Event must be completed
    const { data: event } = await client
      .from('events')
      .select('id, title')
      .eq('id', dto.event_id)
      .eq('status', 'completed')
      .maybeSingle();

    if (!event)
      throw new BadRequestException('Event is not completed or does not exist');

    // Volunteer must have attended
    const { data: registration } = await client
      .from('event_registrations')
      .select('id')
      .eq('event_id', dto.event_id)
      .eq('volunteer_id', profile.id)
      .in('status', ['checked_in', 'completed'])
      .maybeSingle();

    if (!registration)
      throw new ForbiddenException('You did not attend this event');

    // Enforce 3-post limit per volunteer per event
    const { count: existingCount } = await client
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('volunteer_id', profile.id)
      .eq('event_id', dto.event_id);

    if ((existingCount ?? 0) >= 3) {
      throw new BadRequestException('You can share up to 3 posts per event');
    }

    const { data: post, error } = await client
      .from('posts')
      .insert({
        volunteer_id: profile.id,
        event_id: dto.event_id,
        photo_urls: dto.photo_urls,
        caption: dto.caption ?? null,
      })
      .select('id, volunteer_id, event_id, photo_urls, caption, created_at')
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return post;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPER: privacy gate for a single post
  // Accepts a post row that already includes the volunteer join with is_private.
  // Throws ForbiddenException if the viewer cannot see the post.
  // ─────────────────────────────────────────────────────────────────────────
  private async assertCanViewPost(
    post: any,
    viewerUserId: string | null,
    client: any,
  ): Promise<void> {
    const vol = post.volunteer;
    if (!vol?.is_private) return; // public account — no restriction

    const authorUserId = vol.user_id;
    if (viewerUserId && viewerUserId === authorUserId) return; // own post

    if (viewerUserId) {
      const { data: fr } = await client
        .from('follows')
        .select('id')
        .eq('follower_id', viewerUserId)
        .eq('following_id', authorUserId)
        .eq('status', 'accepted')
        .maybeSingle();
      if (fr) return; // accepted follower
    }

    throw new ForbiddenException('This post is from a private account');
  }

  // Lightweight gate when we only have a post ID (no pre-fetched volunteer join).
  // Runs two small indexed lookups. Use for like/comment/getComments/getPostLikes.
  private async assertCanViewPostById(
    postId: string,
    viewerUserId: string | null,
    client: any,
  ): Promise<void> {
    const { data: post } = await client
      .from('posts')
      .select('volunteer_id')
      .eq('id', postId)
      .maybeSingle();

    if (!post) throw new NotFoundException('Post not found');

    const { data: vol } = await client
      .from('volunteer_profiles')
      .select('user_id, is_private')
      .eq('id', post.volunteer_id)
      .maybeSingle();

    if (!vol?.is_private) return; // public account

    const authorUserId = vol.user_id;
    if (viewerUserId && viewerUserId === authorUserId) return; // own post

    if (viewerUserId) {
      const { data: fr } = await client
        .from('follows')
        .select('id')
        .eq('follower_id', viewerUserId)
        .eq('following_id', authorUserId)
        .eq('status', 'accepted')
        .maybeSingle();
      if (fr) return;
    }

    throw new ForbiddenException('This post is from a private account');
  }

  // --- FEED ---
  // Ranking rule:
  //   Tier 1 (high) — viewer's own posts + accepted-followed accounts (public OR private)
  //   Tier 2 (low)  — public accounts the viewer does NOT follow
  //   Hidden        — private accounts the viewer does NOT have an accepted follow with
  //
  // Within each tier posts are ordered by created_at DESC (as returned by the DB).
  // We fetch a large batch (FEED_BATCH) in one query, rank in JS, then slice the page.
  // This approach is correct and fast at KINDLY's current user scale.
  async getFeed(userId: string, page = 1, limit = 20) {
    const client = this.supabase.getClient();

    const { data: viewerProfile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!viewerProfile) throw new ForbiddenException('Profile not found');

    // 1. Accepted-followed user IDs (auth UUIDs)
    const { data: followedRows } = await client
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .eq('status', 'accepted');

    const followedUserIds = (followedRows ?? []).map(
      (f: any) => f.following_id,
    );

    // 2. Resolve followed user IDs → volunteer profile PKs
    let followedProfileIds: string[] = [];
    if (followedUserIds.length > 0) {
      const { data: fp } = await client
        .from('volunteer_profiles')
        .select('id')
        .in('user_id', followedUserIds);
      followedProfileIds = (fp ?? []).map((p: any) => p.id);
    }

    // High-priority set: viewer's own profile + accepted follows (includes private accounts)
    const highPriorityProfileIds = [
      ...new Set([viewerProfile.id, ...followedProfileIds]),
    ];
    const highPrioritySet = new Set(highPriorityProfileIds);

    // 3. Public profiles the viewer does NOT follow (low-priority)
    //    Cap at 500 rows — just UUIDs, very small payload.
    const { data: allPublicProfiles } = await client
      .from('volunteer_profiles')
      .select('id, user_id')
      .eq('is_private', false)
      .limit(500);

    const excludeUserIdSet = new Set([userId, ...followedUserIds]);
    const publicNonFollowedProfileIds = (allPublicProfiles ?? [])
      .filter((p: any) => !excludeUserIdSet.has(p.user_id))
      .map((p: any) => p.id);

    // 4. Union of all eligible profile IDs for the single DB query
    const allEligibleIds = [
      ...new Set([...highPriorityProfileIds, ...publicNonFollowedProfileIds]),
    ];

    if (!allEligibleIds.length) return { posts: [], page, limit };

    // 5. Fetch a large recent batch; sort in JS for correct tier ordering.
    //    FEED_BATCH covers ~15 pages of 20 posts. Adjust if needed.
    const FEED_BATCH = 300;
    const { data: rawPosts, error } = await client
      .from('posts')
      .select(
        `
        id, volunteer_id, event_id, photo_urls, caption, created_at,
        volunteer:volunteer_profiles(id, user_id, full_name, avatar_url, is_verified),
        event:events(id, title)
      `,
      )
      .in('volunteer_id', allEligibleIds)
      .order('created_at', { ascending: false })
      .limit(FEED_BATCH);

    if (error) throw new BadRequestException(error.message);

    // 6. Two-tier ranking: followed+self first (already sorted by DB), then public
    const highGroup = (rawPosts ?? []).filter((p: any) =>
      highPrioritySet.has(p.volunteer_id),
    );
    const lowGroup = (rawPosts ?? []).filter(
      (p: any) => !highPrioritySet.has(p.volunteer_id),
    );
    const ranked = [...highGroup, ...lowGroup];

    // 7. Paginate the ranked list
    const offset = (page - 1) * limit;
    const posts = ranked.slice(offset, offset + limit);

    if (!posts.length) return { posts: [], page, limit };

    // 8. Batch-fetch engagement data only for the current page's posts
    const postIds = posts.map((p: any) => p.id);

    const [{ data: allLikes }, { data: viewerLikes }, { data: allComments }] =
      await Promise.all([
        client.from('post_likes').select('post_id').in('post_id', postIds),
        client
          .from('post_likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('volunteer_id', viewerProfile.id),
        client.from('post_comments').select('post_id').in('post_id', postIds),
      ]);

    const likeCountMap: Record<string, number> = {};
    for (const l of allLikes ?? []) {
      likeCountMap[l.post_id] = (likeCountMap[l.post_id] ?? 0) + 1;
    }
    const commentCountMap: Record<string, number> = {};
    for (const c of allComments ?? []) {
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1;
    }
    const viewerLikedSet = new Set(
      (viewerLikes ?? []).map((l: any) => l.post_id),
    );

    return {
      posts: posts.map((p: any) => ({
        ...p,
        like_count: likeCountMap[p.id] ?? 0,
        comment_count: commentCountMap[p.id] ?? 0,
        viewer_has_liked: viewerLikedSet.has(p.id),
      })),
      page,
      limit,
    };
  }

  // --- SINGLE POST ---
  async getPost(postId: string, userId: string | null) {
    const client = this.supabase.getClient();

    // Include is_private so the privacy gate can inspect it without an extra round-trip.
    const { data: post } = await client
      .from('posts')
      .select(
        `
        id, volunteer_id, event_id, photo_urls, caption, created_at,
        volunteer:volunteer_profiles(id, user_id, full_name, avatar_url, is_verified, is_private),
        event:events(id, title)
      `,
      )
      .eq('id', postId)
      .maybeSingle();

    if (!post) throw new NotFoundException('Post not found');

    // ── Privacy gate (Bouncer) ─────────────────────────────────────────────
    await this.assertCanViewPost(post, userId, client);
    // ──────────────────────────────────────────────────────────────────────

    // Viewer profile for like status
    let viewerProfileId: string | null = null;
    if (userId) {
      const { data: vp } = await client
        .from('volunteer_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      viewerProfileId = vp?.id ?? null;
    }

    const [{ data: likes }, { data: comments }] = await Promise.all([
      client
        .from('post_likes')
        .select('volunteer_id')
        .eq('post_id', postId)
        .limit(200),
      client
        .from('post_comments')
        .select(
          `
          id, content, created_at,
          volunteer:volunteer_profiles(id, user_id, full_name, avatar_url)
        `,
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100),
    ]);

    // Strip internal privacy field before returning to the client
    const { is_private: _priv, ...volunteerPublic } =
      (post.volunteer as any) ?? {};

    return {
      ...post,
      volunteer: volunteerPublic,
      like_count: (likes ?? []).length,
      viewer_has_liked: viewerProfileId
        ? (likes ?? []).some((l: any) => l.volunteer_id === viewerProfileId)
        : false,
      comments: comments ?? [],
    };
  }

  // --- DELETE POST ---
  async deletePost(postId: string, userId: string) {
    const client = this.supabase.getClient();

    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) throw new ForbiddenException('Profile not found');

    const { data: post } = await client
      .from('posts')
      .select('id, volunteer_id, photo_urls')
      .eq('id', postId)
      .maybeSingle();

    if (!post) throw new NotFoundException('Post not found');
    if (post.volunteer_id !== profile.id)
      throw new ForbiddenException('Not your post');

    const { error } = await client.from('posts').delete().eq('id', postId);
    if (error) throw new BadRequestException(error.message);

    // Clean up the post's photos from storage (photo_urls is a text[]).
    await removeFromStorage(client, 'post-photos', post.photo_urls ?? []);

    return { message: 'Post deleted' };
  }

  // --- TOGGLE LIKE ---
  // Insert → if unique constraint violation (23505), it's already liked → unlike instead
  async toggleLike(postId: string, userId: string) {
    const client = this.supabase.getClient();

    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) throw new ForbiddenException('Profile not found');

    // ── Privacy gate: cannot like posts from private accounts you don't follow ──
    await this.assertCanViewPostById(postId, userId, client);
    // ─────────────────────────────────────────────────────────────────────────

    const { data: post } = await client
      .from('posts')
      .select('id, volunteer_id')
      .eq('id', postId)
      .maybeSingle();

    if (!post) throw new NotFoundException('Post not found');

    const isSelfLike = post.volunteer_id === profile.id;

    // Resolve post owner's auth user_id up front — needed for both like and unlike paths
    let postOwnerUserId: string | null = null;
    if (!isSelfLike) {
      const { data: authorProfile } = await client
        .from('volunteer_profiles')
        .select('user_id')
        .eq('id', post.volunteer_id)
        .maybeSingle();
      postOwnerUserId = authorProfile?.user_id ?? null;
    }

    const { error } = await client
      .from('post_likes')
      .insert({ post_id: postId, volunteer_id: profile.id });

    if (!error) {
      if (!isSelfLike && postOwnerUserId) {
        this.upsertLikeNotification(postId, postOwnerUserId).catch(
          console.error,
        );
      }
      return { liked: true };
    }

    if (error.code === '23505') {
      // Already liked → unlike
      await client
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('volunteer_id', profile.id);

      if (!isSelfLike && postOwnerUserId) {
        this.upsertLikeNotification(postId, postOwnerUserId).catch(
          console.error,
        );
      }
      return { liked: false };
    }

    throw new BadRequestException(error.message);
  }

  // Upserts a single aggregated "post_liked" notification for the post owner.
  // Re-runs after every like/unlike so the message always reflects current liker list.
  private async upsertLikeNotification(
    postId: string,
    postOwnerUserId: string,
  ): Promise<void> {
    const client = this.supabase.getClient();

    const { data: likes } = await client
      .from('post_likes')
      .select('volunteer_id, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    const likerCount = (likes ?? []).length;

    if (likerCount === 0) {
      // All likes removed — delete the aggregated notification
      await client
        .from('notifications')
        .delete()
        .eq('recipient_id', postOwnerUserId)
        .eq('entity_id', postId)
        .eq('type', 'post_liked');
      return;
    }

    // Fetch top-2 likers' names + user_id (user_id needed for actor_id on INSERT)
    const top2ProfileIds = (likes ?? [])
      .slice(0, 2)
      .map((l: any) => l.volunteer_id);
    const { data: top2Profiles } = await client
      .from('volunteer_profiles')
      .select('id, user_id, full_name')
      .in('id', top2ProfileIds);

    const profileMap: Record<string, { user_id: string; full_name: string }> =
      {};
    for (const p of top2Profiles ?? []) profileMap[p.id] = p;

    const names = top2ProfileIds.map(
      (id: string) => profileMap[id]?.full_name ?? 'Someone',
    );

    let message: string;
    if (likerCount === 1) {
      message = `${names[0]} liked your post.`;
    } else if (likerCount === 2) {
      message = `${names[0]} and ${names[1]} liked your post.`;
    } else {
      const others = likerCount - 2;
      message = `${names[0]}, ${names[1]}, and ${others} other${others > 1 ? 's' : ''} liked your post.`;
    }

    const { data: existing } = await client
      .from('notifications')
      .select('id')
      .eq('recipient_id', postOwnerUserId)
      .eq('entity_id', postId)
      .eq('type', 'post_liked')
      .maybeSingle();

    if (existing) {
      await client
        .from('notifications')
        .update({ message, read: false, created_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      const actorUserId = profileMap[top2ProfileIds[0]]?.user_id ?? null;
      await client.from('notifications').insert({
        recipient_id: postOwnerUserId,
        actor_id: actorUserId,
        type: 'post_liked',
        message,
        entity_id: postId,
      });
    }
  }

  // --- COMMENTS ---
  async getComments(postId: string, viewerUserId: string | null = null) {
    const client = this.supabase.getClient();

    // ── Privacy gate ──────────────────────────────────────────────────────
    await this.assertCanViewPostById(postId, viewerUserId, client);
    // ─────────────────────────────────────────────────────────────────────

    const { data: comments, error } = await client
      .from('post_comments')
      .select(
        `
        id, content, created_at,
        volunteer:volunteer_profiles(id, user_id, full_name, avatar_url)
      `,
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw new BadRequestException(error.message);
    return comments ?? [];
  }

  async deleteComment(commentId: string, postId: string, userId: string) {
    const client = this.supabase.getClient();

    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) throw new ForbiddenException('Profile not found');

    const { data: comment } = await client
      .from('post_comments')
      .select('id, volunteer_id, post_id')
      .eq('id', commentId)
      .eq('post_id', postId)
      .maybeSingle();

    if (!comment) throw new NotFoundException('Comment not found');

    const isAuthor = comment.volunteer_id === profile.id;

    if (!isAuthor) {
      // Post owner can also delete any comment on their post
      const { data: post } = await client
        .from('posts')
        .select('volunteer_id')
        .eq('id', postId)
        .maybeSingle();

      if (!post || post.volunteer_id !== profile.id) {
        throw new ForbiddenException('Not authorized to delete this comment');
      }
    }

    const { error } = await client
      .from('post_comments')
      .delete()
      .eq('id', commentId);
    if (error) throw new BadRequestException(error.message);

    return { message: 'Comment deleted' };
  }

  async addComment(postId: string, userId: string, dto: CreateCommentDto) {
    const client = this.supabase.getClient();

    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) throw new ForbiddenException('Profile not found');

    // ── Privacy gate: cannot comment on posts from private accounts you don't follow ──
    await this.assertCanViewPostById(postId, userId, client);
    // ──────────────────────────────────────────────────────────────────────────────────

    const { data: post } = await client
      .from('posts')
      .select('id, volunteer_id')
      .eq('id', postId)
      .maybeSingle();

    if (!post) throw new NotFoundException('Post not found');

    const { data: comment, error } = await client
      .from('post_comments')
      .insert({
        post_id: postId,
        volunteer_id: profile.id,
        content: dto.content,
      })
      .select(
        `
        id, content, created_at,
        volunteer:volunteer_profiles(id, user_id, full_name, avatar_url)
      `,
      )
      .single();

    if (error) throw new BadRequestException(error.message);

    // Notify post author (skip self-comment)
    if (post.volunteer_id !== profile.id) {
      const { data: authorProfile } = await client
        .from('volunteer_profiles')
        .select('user_id')
        .eq('id', post.volunteer_id)
        .maybeSingle();

      if (authorProfile) {
        this.upsertCommentNotification(
          postId,
          authorProfile.user_id,
          profile.id,
        ).catch(console.error);
      }
    }

    return comment;
  }

  // Upserts a single aggregated "post_commented" notification, grouping all commenters
  // from the last hour into one message. Prevents spam when many people comment at once.
  private async upsertCommentNotification(
    postId: string,
    postOwnerUserId: string,
    commenterProfileId: string,
  ): Promise<void> {
    const client = this.supabase.getClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentComments } = await client
      .from('post_comments')
      .select('volunteer_id, created_at')
      .eq('post_id', postId)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    // Deduplicate by volunteer_id, preserving most-recent-first order
    const seenIds = new Set<string>();
    const uniqueCommenters: string[] = [];
    for (const c of recentComments ?? []) {
      if (!seenIds.has(c.volunteer_id)) {
        seenIds.add(c.volunteer_id);
        uniqueCommenters.push(c.volunteer_id);
      }
    }

    if (uniqueCommenters.length === 0) return;

    const top2Ids = uniqueCommenters.slice(0, 2);
    const { data: top2Profiles } = await client
      .from('volunteer_profiles')
      .select('id, user_id, full_name')
      .in('id', top2Ids);

    const profileMap: Record<string, { user_id: string; full_name: string }> =
      {};
    for (const p of top2Profiles ?? []) profileMap[p.id] = p;

    const names = top2Ids.map(
      (id: string) => profileMap[id]?.full_name ?? 'Someone',
    );
    const total = uniqueCommenters.length;

    let message: string;
    if (total === 1) {
      message = `${names[0]} commented on your post.`;
    } else if (total === 2) {
      message = `${names[0]} and ${names[1]} commented on your post.`;
    } else {
      const others = total - 2;
      message = `${names[0]}, ${names[1]}, and ${others} other${others > 1 ? 's' : ''} commented on your post.`;
    }

    const { data: existing } = await client
      .from('notifications')
      .select('id')
      .eq('recipient_id', postOwnerUserId)
      .eq('entity_id', postId)
      .eq('type', 'post_commented')
      .maybeSingle();

    if (existing) {
      await client
        .from('notifications')
        .update({ message, read: false, created_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      const actorUserId = profileMap[top2Ids[0]]?.user_id ?? null;
      await client.from('notifications').insert({
        recipient_id: postOwnerUserId,
        actor_id: actorUserId,
        type: 'post_commented',
        message,
        entity_id: postId,
      });
    }
  }

  // --- POST LIKES LIST ---
  async getPostLikes(postId: string, viewerUserId: string | null = null) {
    const client = this.supabase.getClient();

    // ── Privacy gate: cannot view likes on posts from private accounts ──
    // (assertCanViewPostById also verifies the post exists)
    await this.assertCanViewPostById(postId, viewerUserId, client);
    // ────────────────────────────────────────────────────────────────────

    const { data: post } = await client
      .from('posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    if (!post) throw new NotFoundException('Post not found');

    const { data: likes, error } = await client
      .from('post_likes')
      .select(
        `
        volunteer_id,
        created_at,
        volunteer:volunteer_profiles(id, user_id, full_name, avatar_url, is_verified)
      `,
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw new BadRequestException(error.message);

    return (likes ?? []).map((l: any) => l.volunteer);
  }

  // --- VOLUNTEER PROFILE POSTS GRID ---
  // volunteerId is volunteer_profiles.user_id (auth UUID) — matches the /volunteers/:id URL pattern
  async getVolunteerPosts(targetUserId: string, viewerUserId: string | null) {
    const client = this.supabase.getClient();

    const { data: targetProfile } = await client
      .from('volunteer_profiles')
      .select('id, user_id, is_private')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetProfile) throw new NotFoundException('Volunteer not found');

    // Privacy gate: return [] silently (not 403) so profile page can show "Private" state
    if (targetProfile.is_private) {
      const isSelf = viewerUserId === targetProfile.user_id;
      if (!isSelf) {
        let canView = false;
        if (viewerUserId) {
          const { data: followRecord } = await client
            .from('follows')
            .select('id')
            .eq('follower_id', viewerUserId)
            .eq('following_id', targetProfile.user_id)
            .eq('status', 'accepted')
            .maybeSingle();
          canView = !!followRecord;
        }
        if (!canView) return { posts: [], is_private: true };
      }
    }

    // Viewer profile id (for like status)
    let viewerProfileId: string | null = null;
    if (viewerUserId) {
      const { data: vp } = await client
        .from('volunteer_profiles')
        .select('id')
        .eq('user_id', viewerUserId)
        .maybeSingle();
      viewerProfileId = vp?.id ?? null;
    }

    const { data: posts, error } = await client
      .from('posts')
      .select(
        `
        id, volunteer_id, event_id, photo_urls, caption, created_at,
        event:events(id, title)
      `,
      )
      .eq('volunteer_id', targetProfile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new BadRequestException(error.message);

    const postIds = (posts ?? []).map((p: any) => p.id);
    if (!postIds.length) return { posts: [], is_private: false };

    const [{ data: allLikes }, { data: viewerLikes }] = await Promise.all([
      client.from('post_likes').select('post_id').in('post_id', postIds),
      viewerProfileId
        ? client
            .from('post_likes')
            .select('post_id')
            .in('post_id', postIds)
            .eq('volunteer_id', viewerProfileId)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const likeCountMap: Record<string, number> = {};
    for (const l of allLikes ?? []) {
      likeCountMap[l.post_id] = (likeCountMap[l.post_id] ?? 0) + 1;
    }
    const viewerLikedSet = new Set(
      (viewerLikes ?? []).map((l: any) => l.post_id),
    );

    return {
      posts: (posts ?? []).map((p: any) => ({
        ...p,
        like_count: likeCountMap[p.id] ?? 0,
        viewer_has_liked: viewerLikedSet.has(p.id),
      })),
      is_private: false,
    };
  }
}
