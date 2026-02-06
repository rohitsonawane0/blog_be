import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class TagsService {

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) { }
  create(createTagDto: CreateTagDto) {
    const tag = this.tagRepository.create(createTagDto);
    return this.tagRepository.save(tag);
  }

  findAll(search?: string) {
    return this.tagRepository.find({
      where: {
        name: search ? (Like(`%${search}%`)) : undefined,
      },
    });
  }

  findOne(id: string) {
    return this.tagRepository.findOne({ where: { id } });
  }

  update(id: string, updateTagDto: UpdateTagDto) {
    return this.tagRepository.update(id, updateTagDto);
  }

  remove(id: string) {
    return this.tagRepository.softDelete(id);
  }
}
