# Tags Module Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the **Tags** module in the Blog Backend application. Tags allow users to categorize and organize blog posts with multiple keywords, enabling better content discovery and filtering.

---

## Table of Contents

1. [Entity Design](#1-entity-design)
2. [DTOs (Data Transfer Objects)](#2-dtos-data-transfer-objects)
3. [Service Implementation](#3-service-implementation)
4. [Controller Implementation](#4-controller-implementation)
5. [Module Configuration](#5-module-configuration)
6. [Blog-Tag Relationship](#6-blog-tag-relationship)
7. [API Endpoints](#7-api-endpoints)
8. [Testing with cURL](#8-testing-with-curl)

---

## 1. Entity Design

### File: `src/modules/tags/entities/tag.entity.ts`

```typescript
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToMany,
} from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';

@Entity('tags')
export class Tag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 50 })
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ nullable: true, length: 255 })
    description: string;

    @Column({ nullable: true })
    color: string; // Hex color for UI display (e.g., "#FF5733")

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    // Many-to-Many relationship with Blog
    @ManyToMany(() => Blog, (blog) => blog.tags)
    blogs: Blog[];
}
```

### Key Fields Explained

| Field       | Type     | Description                                      |
|-------------|----------|--------------------------------------------------|
| `id`        | UUID     | Primary key, auto-generated                      |
| `name`      | string   | Unique tag name (max 50 chars)                   |
| `slug`      | string   | URL-friendly version of name                     |
| `description` | string | Optional description of the tag                  |
| `color`     | string   | Optional hex color for UI styling                |
| `createdAt` | Date     | Auto-generated creation timestamp                |
| `updatedAt` | Date     | Auto-updated modification timestamp              |
| `deletedAt` | Date     | Soft delete timestamp (null if not deleted)      |
| `blogs`     | Blog[]   | Many-to-Many relationship with blogs             |

---

## 2. DTOs (Data Transfer Objects)

### File: `src/modules/tags/dto/create-tag.dto.ts`

```typescript
import { IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateTagDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;

    @IsString()
    @IsOptional()
    @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: 'Color must be a valid hex color (e.g., #FF5733)',
    })
    color?: string;
}
```

### File: `src/modules/tags/dto/update-tag.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTagDto } from './create-tag.dto';

export class UpdateTagDto extends PartialType(CreateTagDto) {}
```

---

## 3. Service Implementation

### File: `src/modules/tags/tags.service.ts`

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private readonly tagsRepository: Repository<Tag>,
    ) {}

    /**
     * Create a new tag
     */
    async create(createTagDto: CreateTagDto): Promise<Tag> {
        const slug = this.generateSlug(createTagDto.name);

        // Check for existing tag with same name or slug
        const existingTag = await this.tagsRepository.findOne({
            where: [{ name: createTagDto.name }, { slug }],
        });

        if (existingTag) {
            throw new ConflictException('Tag with this name or slug already exists');
        }

        const tag = this.tagsRepository.create({
            ...createTagDto,
            slug,
        });

        return this.tagsRepository.save(tag);
    }

    /**
     * Get all tags
     */
    async findAll(): Promise<Tag[]> {
        return this.tagsRepository.find({
            order: { name: 'ASC' },
        });
    }

    /**
     * Get a single tag by ID
     */
    async findOne(id: string): Promise<Tag> {
        const tag = await this.tagsRepository.findOne({ where: { id } });
        if (!tag) {
            throw new NotFoundException(`Tag with ID ${id} not found`);
        }
        return tag;
    }

    /**
     * Get a tag by slug
     */
    async findBySlug(slug: string): Promise<Tag> {
        const tag = await this.tagsRepository.findOne({ where: { slug } });
        if (!tag) {
            throw new NotFoundException(`Tag with slug "${slug}" not found`);
        }
        return tag;
    }

    /**
     * Get multiple tags by IDs
     */
    async findByIds(ids: string[]): Promise<Tag[]> {
        return this.tagsRepository.find({
            where: { id: In(ids) },
        });
    }

    /**
     * Update a tag
     */
    async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
        const tag = await this.findOne(id);

        if (updateTagDto.name && updateTagDto.name !== tag.name) {
            const slug = this.generateSlug(updateTagDto.name);

            // Check for conflicts with other tags
            const existing = await this.tagsRepository.findOne({
                where: [{ name: updateTagDto.name }, { slug }],
            });

            if (existing && existing.id !== id) {
                throw new ConflictException('Tag with this name or slug already exists');
            }

            tag.slug = slug;
            tag.name = updateTagDto.name;
        }

        if (updateTagDto.description !== undefined) {
            tag.description = updateTagDto.description;
        }

        if (updateTagDto.color !== undefined) {
            tag.color = updateTagDto.color;
        }

        return this.tagsRepository.save(tag);
    }

    /**
     * Soft delete a tag
     */
    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.tagsRepository.softDelete(id);
    }

    /**
     * Restore a soft-deleted tag
     */
    async restore(id: string): Promise<Tag> {
        const result = await this.tagsRepository.restore(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Tag with ID ${id} not found`);
        }
        return this.findOne(id);
    }

    /**
     * Get popular tags (by blog count)
     */
    async findPopular(limit: number = 10): Promise<Tag[]> {
        return this.tagsRepository
            .createQueryBuilder('tag')
            .leftJoin('tag.blogs', 'blog')
            .addSelect('COUNT(blog.id)', 'blogCount')
            .groupBy('tag.id')
            .orderBy('blogCount', 'DESC')
            .limit(limit)
            .getMany();
    }

    /**
     * Generate URL-friendly slug from name
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
```

---

## 4. Controller Implementation

### File: `src/modules/tags/tags.controller.ts`

```typescript
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    /**
     * Create a new tag (Admin only)
     */
    @Roles(UserRole.admin)
    @Post()
    create(@Body() createTagDto: CreateTagDto) {
        return this.tagsService.create(createTagDto);
    }

    /**
     * Get all tags (Public)
     */
    @Public()
    @Get()
    findAll() {
        return this.tagsService.findAll();
    }

    /**
     * Get popular tags (Public)
     */
    @Public()
    @Get('popular')
    findPopular(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.tagsService.findPopular(limit);
    }

    /**
     * Get tag by slug (Public)
     */
    @Public()
    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.tagsService.findBySlug(slug);
    }

    /**
     * Get a single tag by ID (Public)
     */
    @Public()
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.tagsService.findOne(id);
    }

    /**
     * Update a tag (Admin only)
     */
    @Roles(UserRole.admin)
    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateTagDto: UpdateTagDto,
    ) {
        return this.tagsService.update(id, updateTagDto);
    }

    /**
     * Delete a tag (Admin only)
     */
    @Roles(UserRole.admin)
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.tagsService.remove(id);
    }

    /**
     * Restore a soft-deleted tag (Admin only)
     */
    @Roles(UserRole.admin)
    @Patch(':id/restore')
    restore(@Param('id', ParseUUIDPipe) id: string) {
        return this.tagsService.restore(id);
    }
}
```

---

## 5. Module Configuration

### File: `src/modules/tags/tags.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { Tag } from './entities/tag.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Tag])],
    controllers: [TagsController],
    providers: [TagsService],
    exports: [TagsService], // Export for use in BlogsModule
})
export class TagsModule {}
```

---

## 6. Blog-Tag Relationship

### Update Blog Entity: `src/modules/blogs/entities/blog.entity.ts`

Add the Many-to-Many relationship with tags:

```typescript
import { User } from "src/modules/users/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { BlogStatus } from "../enums/blog-status.enum";
import { Category } from "../../categories/entities/category.entity";
import { Tag } from "../../tags/entities/tag.entity";

@Entity()
export class Blog {
    // ... existing fields ...

    @ManyToMany(() => Tag, (tag) => tag.blogs)
    @JoinTable({
        name: 'blog_tags', // Junction table name
        joinColumn: {
            name: 'blogId',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'tagId',
            referencedColumnName: 'id',
        },
    })
    tags: Tag[];
}
```

### Update Create Blog DTO: `src/modules/blogs/dto/create-blog.dto.ts`

Add `tagIds` field:

```typescript
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateBlogDto {
    // ... existing fields ...

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    tagIds?: string[];
}
```

### Update Blogs Service: `src/modules/blogs/blogs.service.ts`

Add tag handling in create and update methods:

```typescript
import { TagsService } from '../tags/tags.service';

@Injectable()
export class BlogsService {
    constructor(
        @InjectRepository(Blog)
        private readonly blogsRepository: Repository<Blog>,
        private readonly tagsService: TagsService,
    ) {}

    async create(createBlogDto: CreateBlogDto, authorId: string): Promise<Blog> {
        // ... existing logic ...

        // Handle tags
        if (createBlogDto.tagIds && createBlogDto.tagIds.length > 0) {
            const tags = await this.tagsService.findByIds(createBlogDto.tagIds);
            blog.tags = tags;
        }

        return this.blogsRepository.save(blog);
    }

    async findOne(id: string): Promise<Blog> {
        const blog = await this.blogsRepository.findOne({
            where: { id },
            relations: ['author', 'category', 'tags'], // Include tags
        });
        
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }
        
        return blog;
    }

    async findByTag(tagId: string): Promise<Blog[]> {
        return this.blogsRepository
            .createQueryBuilder('blog')
            .leftJoinAndSelect('blog.tags', 'tag')
            .where('tag.id = :tagId', { tagId })
            .getMany();
    }
}
```

### Update Blogs Module: `src/modules/blogs/blogs.module.ts`

Import TagsModule:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { Blog } from './entities/blog.entity';
import { TagsModule } from '../tags/tags.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Blog]),
        TagsModule, // Import TagsModule
    ],
    controllers: [BlogsController],
    providers: [BlogsService],
})
export class BlogsModule {}
```

---

## 7. API Endpoints

### Tags Endpoints

| Method | Endpoint               | Auth      | Description                  |
|--------|------------------------|-----------|------------------------------|
| POST   | `/tags`                | Admin     | Create a new tag             |
| GET    | `/tags`                | Public    | Get all tags                 |
| GET    | `/tags/popular`        | Public    | Get popular tags             |
| GET    | `/tags/slug/:slug`     | Public    | Get tag by slug              |
| GET    | `/tags/:id`            | Public    | Get tag by ID                |
| PATCH  | `/tags/:id`            | Admin     | Update a tag                 |
| DELETE | `/tags/:id`            | Admin     | Soft delete a tag            |
| PATCH  | `/tags/:id/restore`    | Admin     | Restore deleted tag          |

### Blog-Tag Endpoints

| Method | Endpoint               | Auth      | Description                  |
|--------|------------------------|-----------|------------------------------|
| GET    | `/blogs/tag/:tagId`    | Public    | Get blogs by tag             |

---

## 8. Testing with cURL

### Create a Tag

```bash
curl -X POST http://localhost:3000/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "JavaScript",
    "description": "Posts about JavaScript programming",
    "color": "#F7DF1E"
  }'
```

### Get All Tags

```bash
curl -X GET http://localhost:3000/tags
```

### Get Popular Tags

```bash
curl -X GET "http://localhost:3000/tags/popular?limit=5"
```

### Get Tag by Slug

```bash
curl -X GET http://localhost:3000/tags/slug/javascript
```

### Get Tag by ID

```bash
curl -X GET http://localhost:3000/tags/550e8400-e29b-41d4-a716-446655440000
```

### Update a Tag

```bash
curl -X PATCH http://localhost:3000/tags/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "description": "Updated description for JavaScript tag",
    "color": "#FFD700"
  }'
```

### Delete a Tag

```bash
curl -X DELETE http://localhost:3000/tags/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Restore a Deleted Tag

```bash
curl -X PATCH http://localhost:3000/tags/550e8400-e29b-41d4-a716-446655440000/restore \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Blog with Tags

```bash
curl -X POST http://localhost:3000/blogs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Getting Started with JavaScript",
    "content": "Your blog content here...",
    "categoryId": "category-uuid",
    "tagIds": [
      "tag-uuid-1",
      "tag-uuid-2"
    ]
  }'
```

---

## Implementation Checklist

- [ ] Create/Update `Tag` entity with all fields
- [ ] Create `CreateTagDto` with validation
- [ ] Update `UpdateTagDto` (extends PartialType)
- [ ] Implement `TagsService` with all CRUD operations
- [ ] Implement `TagsController` with proper decorators
- [ ] Update `TagsModule` with TypeORM and exports
- [ ] Add Many-to-Many relationship in `Blog` entity
- [ ] Update `CreateBlogDto` to accept `tagIds`
- [ ] Update `BlogsService` to handle tags
- [ ] Import `TagsModule` in `BlogsModule`
- [ ] Test all endpoints with cURL or Postman

---

## Notes

1. **Soft Delete**: Tags use soft delete (`deletedAt` field) to preserve referential integrity with blogs.

2. **Slug Generation**: Slugs are auto-generated from the tag name for SEO-friendly URLs.

3. **Color Field**: Optional hex color field for UI theming/badges.

4. **Many-to-Many**: The `blog_tags` junction table is automatically managed by TypeORM.

5. **Authorization**: 
   - Read operations (GET) are public
   - Write operations (POST, PATCH, DELETE) require admin role

6. **Validation**: The `@Matches` decorator ensures proper hex color format.
