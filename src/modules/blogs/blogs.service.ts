import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { In, Like, Repository } from 'typeorm';

import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CategoriesService } from '../categories/categories.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { TagsService } from '../tags/tags.service';
import { Tag } from '../tags/entities/tag.entity';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createBlogDto: CreateBlogDto, user: JwtPayload) {
    if (createBlogDto.categoryId) {
      await this.validateCategory(createBlogDto.categoryId);
    }

    let tags: Tag[] = [];
    if (createBlogDto.tagIds?.length) {
      tags = await this.validateAndGetTags(createBlogDto.tagIds);
    }

    const slug = await this.createSlug(createBlogDto.title);

    const blog = this.blogRepository.create({
      ...createBlogDto,
      slug,
      authorId: user.sub,
      tags,
    });
    return this.blogRepository.save(blog);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await this.blogRepository.findAndCount({
      where: search ? { title: Like(`%${search}%`) } : undefined,
      relations: ['author', 'category', 'tags'],
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
        },
        tags: {
          id: true,
          name: true,
          slug: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['author', 'category', 'tags'],
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
        },
        tags: {
          id: true,
          name: true,
          slug: true,
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
      relations: ['author', 'category', 'tags'],
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
        },
        tags: {
          id: true,
          name: true,
          slug: true,
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

  async update(id: string, updateBlogDto: UpdateBlogDto) {
    const blog = await this.findOne(id);

    if (updateBlogDto.categoryId) {
      await this.validateCategory(updateBlogDto.categoryId);
    }

    if (updateBlogDto.tagIds !== undefined) {
      blog.tags = updateBlogDto.tagIds.length
        ? await this.validateAndGetTags(updateBlogDto.tagIds)
        : [];
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
        throw new BadRequestException(
          `Category with ID ${categoryId} does not exist`,
        );
      }
      throw error;
    }
  }

  private async validateAndGetTags(tagIds: string[]): Promise<Tag[]> {
    const tags = await this.blogRepository.manager.find(Tag, {
      where: { id: In(tagIds) },
    });

    if (tags.length !== tagIds.length) {
      const foundIds = tags.map((t) => t.id);
      const missingIds = tagIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Tags not found: ${missingIds.join(', ')}`);
    }

    return tags;
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

  async deleteAllBlogs() {
    await this.blogRepository.deleteAll();
  }
}
