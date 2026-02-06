import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto, user);
  }

  @Public()
  @Get('blog/:blogId')
  findAllByBlogId(
    @Param('blogId') blogId: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.commentsService.findAllByBlogId(blogId, paginationDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.update(id, updateCommentDto, user);
  }

  @Roles(UserRole.admin)
  @Patch(':id/toggle-hidden')
  toggleHidden(@Param('id') id: string) {
    return this.commentsService.toggleHidden(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commentsService.remove(id, user);
  }
}
