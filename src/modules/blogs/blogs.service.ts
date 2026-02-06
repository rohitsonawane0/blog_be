import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Repository } from 'typeorm';

import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    private readonly categoriesService: CategoriesService,
  ) { }

  async create(createBlogDto: CreateBlogDto, user: JwtPayload) {
    if (createBlogDto.categoryId) {
      await this.validateCategory(createBlogDto.categoryId);
    }

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
      relations: ['author', 'category'],
      select: {
        author: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        category: {
          id: true,
          name: true,
          slug: true,
        }
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['author', 'category'],
      select: {
        author: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        category: {
          id: true,
          name: true,
          slug: true,
        }
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
      relations: ['author', 'category'],
      select: {
        author: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        category: {
          id: true,
          name: true,
          slug: true,
        }
      },
    });
    if (!blog) {
      throw new NotFoundException(`Blog with slug ${slug} not found`);
    }
    // Increment view count
    await this.blogRepository.increment({ id: blog.id }, 'viewCount', 1);
    return blog;
  }

  async update(id: string, updateBlogDto: UpdateBlogDto) {
    const blog = await this.findOne(id);

    if (updateBlogDto.categoryId) {
      await this.validateCategory(updateBlogDto.categoryId);
    }

    // Note: Author check should be done in Controller or Guard
    Object.assign(blog, updateBlogDto);
    return this.blogRepository.save(blog);
  }

  async remove(id: string) {
    const blog = await this.findOne(id);
    return this.blogRepository.remove(blog);
  }

  private async validateCategory(categoryId: string) {
    try {
      await this.categoriesService.findOne(categoryId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`Category with ID ${categoryId} does not exist`);
      }
      throw error;
    }
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
