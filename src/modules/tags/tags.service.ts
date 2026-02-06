import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Like, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/common/utils/pagination.util';

@Injectable()
export class TagsService {

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) { }
  async create(createTagDto: CreateTagDto) {
    const slug = createTagDto.name.toLowerCase().replace(/\s+/g, '-');
    const existingTag = await this.findOneBySlug(slug);
    if (existingTag) {
      throw new BadRequestException("Tag already exists");
    }
    const tag = this.tagRepository.create({ ...createTagDto, slug });
    return this.tagRepository.save(tag);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await this.tagRepository.findAndCount({
      where: { name: search ? Like(`%${search}%`) : undefined },
      skip,
      take: limit,
    });

    return paginate(items, total, page, limit);
  }

  findOne(id: string) {
    return this.tagRepository.findOne({ where: { id } });
  }

  update(id: string, updateTagDto: UpdateTagDto) {
    return this.tagRepository.update(id, updateTagDto);
  }
  findOneBySlug(slug: string) {
    return this.tagRepository.findOne({ where: { slug } });
  }

  remove(id: string) {
    return this.tagRepository.softDelete(id);
  }
}
