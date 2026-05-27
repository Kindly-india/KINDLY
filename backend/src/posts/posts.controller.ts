import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // Feed: posts from followed volunteers + own posts
  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async getFeed(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.postsService.getFeed(req.user.id, parseInt(page), parseInt(limit));
  }

  // Posts for a specific volunteer's profile grid
  @UseGuards(OptionalAuthGuard)
  @Get('volunteer/:userId')
  async getVolunteerPosts(@Request() req: any, @Param('userId') userId: string) {
    return this.postsService.getVolunteerPosts(userId, req.user?.id ?? null);
  }

  // Create a post (must have attended the event)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Request() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.id, dto);
  }

  // List of volunteers who liked a post
  @UseGuards(OptionalAuthGuard)
  @Get(':id/likes')
  async getPostLikes(@Request() req: any, @Param('id') id: string) {
    return this.postsService.getPostLikes(id, req.user?.id ?? null);
  }

  // Single post detail with comments
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  async getPost(@Request() req: any, @Param('id') id: string) {
    return this.postsService.getPost(id, req.user?.id ?? null);
  }

  // Delete own post
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Request() req: any, @Param('id') id: string) {
    return this.postsService.deletePost(id, req.user.id);
  }

  // Toggle like on a post (like if not liked, unlike if already liked)
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(@Request() req: any, @Param('id') id: string) {
    return this.postsService.toggleLike(id, req.user.id);
  }

  // Get all comments for a post
  @UseGuards(OptionalAuthGuard)
  @Get(':id/comments')
  async getComments(@Request() req: any, @Param('id') id: string) {
    return this.postsService.getComments(id, req.user?.id ?? null);
  }

  // Delete a comment (comment author OR post owner)
  @UseGuards(JwtAuthGuard)
  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Request() req: any,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.postsService.deleteComment(commentId, id, req.user.id);
  }

  // Add a comment to a post
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(id, req.user.id, dto);
  }
}
