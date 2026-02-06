import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';
import { HashingService } from '../hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }
    const isPasswordMatched = await this.hashingService.compare(password, user.password);
    if (!isPasswordMatched) {
      return null;
    }
    return user;
  }
  async login(user: any) {
    return this.getTokens(user.id, user.email, user.role)
  }
  async getTokens(userId: string, email: string, role: UserRole) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION_TIME') as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME') as any,
        },
      ),
    ]);

    return { access_token, refresh_token };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const access_token = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION_TIME') as any,
        },
      );

      return { access_token };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  async register(createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordMatched = await this.hashingService.compare(changePasswordDto.oldPassword, user.password);
    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid old password');
    }
    const hashedPassword = await this.hashingService.hash(changePasswordDto.newPassword);
    await this.userService.updatePassword(userId, hashedPassword);
    return { message: 'Password changed successfully' };
  }

  findOne(id: string) {
    return `This action returns a #${id} auth`;
  }

  update(id: string, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: string) {
    return `This action removes a #${id} auth`;
  }
}
