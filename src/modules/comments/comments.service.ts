import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) { }

  async create(createCommentDto: CreateCommentDto, user: JwtPayload) {
    // Check if user already commented on this blog
    const existingComment = await this.commentRepository.findOne({
      where: {
        blogId: createCommentDto.blogId,
        userId: user.sub,
      },
    });

    if (existingComment) {
      throw new BadRequestException('You have already commented on this blog');
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      userId: user.sub,
    });

    return this.commentRepository.save(comment);
  }

  async findAllByBlogId(blogId: string, paginationDto: PaginationDto, user?: JwtPayload) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // If user is admin, show all comments including hidden
    // Otherwise, only show non-hidden comments OR user's own hidden comment
    const isAdmin = user?.role === UserRole.admin;

    const queryBuilder = this.commentRepository.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.blogId = :blogId', { blogId })
      .select([
        'comment.id',
        'comment.content',
        'comment.isHidden',
        'comment.createdAt',
        'comment.updatedAt',
        'comment.blogId',
        'comment.userId',
        'user.id',
        'user.firstName',
        'user.lastName',
      ])
      .orderBy('comment.createdAt', 'DESC');

    if (!isAdmin) {
      // Non-admin: show non-hidden OR own hidden
      if (user) {
        queryBuilder.andWhere('(comment.isHidden = false OR comment.userId = :userId)', { userId: user.sub });
      } else {
        queryBuilder.andWhere('comment.isHidden = false');
      }
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
      select: {
        user: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, user: JwtPayload) {
    const comment = await this.findOne(id);

    // Only the comment owner can update
    if (comment.userId !== user.sub) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    Object.assign(comment, updateCommentDto);
    return this.commentRepository.save(comment);
  }

  async toggleHidden(id: string) {
    const comment = await this.findOne(id);
    comment.isHidden = !comment.isHidden;
    return this.commentRepository.save(comment);
  }

  async remove(id: string, user: JwtPayload) {
    const comment = await this.findOne(id);

    // Admin can delete any comment, user can only delete their own
    const isAdmin = user.role === UserRole.admin;
    if (!isAdmin && comment.userId !== user.sub) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.commentRepository.remove(comment);
  }
}
