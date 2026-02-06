import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const slug = this.generateSlug(createCategoryDto.name);
    const existingCategory = await this.categoriesRepository.findOne({
      where: [{ name: createCategoryDto.name }, { slug }],
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name or slug already exists');
    }

    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug,
    });

    return this.categoriesRepository.save(category);
  }

  findAll() {
    return this.categoriesRepository.find();
  }

  async findOne(id: string) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (updateCategoryDto.name) {
      const slug = this.generateSlug(updateCategoryDto.name);
      if (slug !== category.slug) {
        const existing = await this.categoriesRepository.findOne({
          where: [{ name: updateCategoryDto.name }, { slug }],
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(
            'Category with this name or slug already exists',
          );
        }
        category.slug = slug;
        category.name = updateCategoryDto.name;
      }
    }

    if (updateCategoryDto.description !== undefined) {
      category.description = updateCategoryDto.description;
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.categoriesRepository.softDelete(id);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
