import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // Global search
  @Get('search')
  async search(@Query('q') query: string) {
    return this.socialService.globalSearch(query);
  }

  // Follow a user (privacy-aware: returns { status: 'pending' | 'accepted' })
  @UseGuards(JwtAuthGuard)
  @Post('follow/:targetId')
  async followUser(@Request() req: any, @Param('targetId') targetId: string) {
    return this.socialService.followUser(req.user.id, targetId);
  }

  // Unfollow / cancel pending request
  @UseGuards(JwtAuthGuard)
  @Delete('follow/:targetId')
  async unfollowUser(@Request() req: any, @Param('targetId') targetId: string) {
    return this.socialService.unfollowUser(req.user.id, targetId);
  }

  // Check follow status — returns { followStatus: 'none' | 'pending' | 'accepted' }
  @UseGuards(OptionalAuthGuard)
  @Get('follow/status/:targetId')
  async getFollowStatus(@Request() req: any, @Param('targetId') targetId: string) {
    if (!req.user) return { followStatus: 'none' };
    return this.socialService.getFollowStatus(req.user.id, targetId);
  }

  // Accept a pending follow request
  @UseGuards(JwtAuthGuard)
  @Post('follow-requests/:requestId/accept')
  async acceptFollowRequest(@Request() req: any, @Param('requestId') requestId: string) {
    return this.socialService.acceptFollowRequest(requestId, req.user.id);
  }

  // Reject / delete a pending follow request
  @UseGuards(JwtAuthGuard)
  @Delete('follow-requests/:requestId')
  async rejectFollowRequest(@Request() req: any, @Param('requestId') requestId: string) {
    return this.socialService.rejectFollowRequest(requestId, req.user.id);
  }

  // Remove a follower from your own followers list
  @UseGuards(JwtAuthGuard)
  @Delete('followers/:followerId')
  async removeFollower(@Request() req: any, @Param('followerId') followerId: string) {
    return this.socialService.removeFollower(req.user.id, followerId);
  }

  // Search history
  @UseGuards(JwtAuthGuard)
  @Get('search/recent')
  async getSearchHistory(@Request() req: any) {
    return this.socialService.getSearchHistory(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('search/recent')
  async saveSearchHistory(@Request() req: any, @Body() body: any) {
    return this.socialService.saveSearchHistory(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('search/recent')
  async clearSearchHistory(@Request() req: any) {
    return this.socialService.clearSearchHistory(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('search/recent/:id')
  async removeSearchHistoryItem(@Request() req: any, @Param('id') id: string) {
    return this.socialService.removeSearchHistoryItem(req.user.id, id);
  }

  // Pending inbound follow requests for current user
  @UseGuards(JwtAuthGuard)
  @Get('follow-requests/pending')
  async getPendingFollowRequests(@Request() req: any) {
    return this.socialService.getPendingFollowRequests(req.user.id);
  }

  // People you might know — volunteer suggestions
  @UseGuards(JwtAuthGuard)
  @Get('suggestions')
  async getSuggestions(@Request() req: any) {
    return this.socialService.getSuggestions(req.user.id);
  }

  // Followers list (private-gated)
  @UseGuards(OptionalAuthGuard)
  @Get(':id/followers')
  async getFollowers(@Request() req: any, @Param('id') id: string) {
    return this.socialService.getFollowers(id, req.user?.id ?? null);
  }

  // Following list (private-gated)
  @UseGuards(OptionalAuthGuard)
  @Get(':id/following')
  async getFollowing(@Request() req: any, @Param('id') id: string) {
    return this.socialService.getFollowing(id, req.user?.id ?? null);
  }
}
