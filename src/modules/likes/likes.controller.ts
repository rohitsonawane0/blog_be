import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { LikesService } from './likes.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  toggle(
    @CurrentUser() user: JwtPayload,
    @Body() toggleLikeDto: ToggleLikeDto,
  ) {
    return this.likesService.toggle(toggleLikeDto.blogId, user);
  }

  @Public()
  @Get('blog/:blogId/count')
  getLikeCount(@Param('blogId') blogId: string) {
    return this.likesService.getLikeCount(blogId);
  }

  @Get('blog/:blogId/status')
  hasUserLiked(
    @Param('blogId') blogId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.likesService.hasUserLiked(blogId, user.sub);
  }

  @Get('my-likes')
  getUserLikedBlogs(@CurrentUser() user: JwtPayload) {
    return this.likesService.getUserLikedBlogs(user.sub);
  }
}
