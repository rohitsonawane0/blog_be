import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) { }

  async create(createBlogDto: CreateBlogDto, user: JwtPayload) {
    const slug = await this.createSlug(createBlogDto.title);
    const blog = this.blogRepository.create({
      ...createBlogDto,
      slug,
      authorId: user.sub,
    });
    return this.blogRepository.save(blog);
  }

  async findAll() {
    return this.blogRepository.find({
      relations: ['author'],
      select: {
        author: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['author'],
      select: {
        author: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    });
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    // Increment view count
    await this.blogRepository.increment({ id }, 'viewCount', 1);
    return blog;
  }

  async findBySlug(slug: string) {
    const blog = await this.blogRepository.findOne({
      where: { slug },
      relations: ['author'],
      select: {
        author: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    });
    if (!blog) {
      throw new NotFoundException(`Blog with slug ${slug} not found`);
    }
    // Increment view count
    await this.blogRepository.increment({ id: blog.id }, 'viewCount', 1);
    return blog;
  }

  async update(id: number, updateBlogDto: UpdateBlogDto) {
    const blog = await this.findOne(id);
    // Note: Author check should be done in Controller or Guard
    Object.assign(blog, updateBlogDto);
    return this.blogRepository.save(blog);
  }

  async remove(id: number) {
    const blog = await this.findOne(id);
    return this.blogRepository.remove(blog);
  }

  private async createSlug(title: string): Promise<string> {
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');

    // Check for duplicates
    let blog = await this.blogRepository.findOne({ where: { slug } });
    if (blog) {
      // If duplicate, append random 4-char string
      const randomString = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${randomString}`;
    }

    // Double check (rare case)
    blog = await this.blogRepository.findOne({ where: { slug } });
    if (blog) {
      const randomString = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${randomString}`;
    }

    return slug;
  }
}
