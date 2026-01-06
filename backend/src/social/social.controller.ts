import { Controller, Get, Post, Delete, Query, Param, UseGuards, Request } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/dto/optional-jwt-auth.guard';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ✅ GLOBAL SEARCH (Volunteers + Orgs)
  @Get('search')
  async search(@Query('q') query: string) {
    return this.socialService.globalSearch(query);
  }

  // ✅ FOLLOW USER (Anyone -> Anyone)
  @UseGuards(JwtAuthGuard)
  @Post('follow/:targetId')
  async followUser(@Request() req, @Param('targetId') targetId: string) {
    return this.socialService.followUser(req.user.id, targetId);
  }

  // ✅ UNFOLLOW USER
  @UseGuards(JwtAuthGuard)
  @Delete('follow/:targetId')
  async unfollowUser(@Request() req, @Param('targetId') targetId: string) {
    return this.socialService.unfollowUser(req.user.id, targetId);
  }

  // ✅ CHECK FOLLOW STATUS
  @UseGuards(OptionalJwtAuthGuard)
  @Get('follow/status/:targetId')
  async getFollowStatus(@Request() req, @Param('targetId') targetId: string) {
    if (!req.user) return { isFollowing: false };
    return this.socialService.getFollowStatus(req.user.id, targetId);
  }
}