import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingService } from '../hashing/hashing.service';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) { }
  async create(createUserDto: CreateUserDto) {
    const isEmailUsed = await this.findByEmail(createUserDto.email);
    if (isEmailUsed) {
      throw new Error('User already exists');
    }
    const hasedPassword = await this.hashingService.hash(createUserDto.password);

    const user = this.userRepository.create({ ...createUserDto, password: hasedPassword });

    return this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }
    // Prevent updating password directly through this method
    if (updateUserDto.password) {
      delete updateUserDto.password;
    }
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async updatePassword(id: number, hasedPassword: string) {
    return this.userRepository.update(id, { password: hasedPassword });
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.userRepository.softDelete(id);
  }
}
