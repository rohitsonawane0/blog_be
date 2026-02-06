import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class LikesService {
    constructor(
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,
    ) { }

    async toggle(blogId: string, user: JwtPayload) {
        const existingLike = await this.likeRepository.findOne({
            where: { blogId, userId: user.sub },
        });

        if (existingLike) {
            await this.likeRepository.remove(existingLike);
            return { liked: false, message: 'Like removed' };
        }

        const like = this.likeRepository.create({
            blogId,
            userId: user.sub,
        });
        await this.likeRepository.save(like);
        return { liked: true, message: 'Blog liked' };
    }

    async getLikeCount(blogId: string) {
        const count = await this.likeRepository.count({ where: { blogId } });
        return { blogId, likeCount: count };
    }

    async hasUserLiked(blogId: string, userId: string) {
        const like = await this.likeRepository.findOne({
            where: { blogId, userId },
        });
        return { blogId, liked: !!like };
    }

    async getUserLikedBlogs(userId: string) {
        const likes = await this.likeRepository.find({
            where: { userId },
            relations: ['blog'],
            select: {
                id: true,
                createdAt: true,
                blog: {
                    id: true,
                    title: true,
                    slug: true,
                    summary: true,
                    coverImage: true,
                }
            },
            order: { createdAt: 'DESC' },
        });

        return likes.map(like => ({
            likedAt: like.createdAt,
            blog: like.blog,
        }));
    }
}
