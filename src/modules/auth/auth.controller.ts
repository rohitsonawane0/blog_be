import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { Response } from 'express';
import { JwtGuard } from './guards/jwt.guard';
import { Public } from 'src/common/decorators/public.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: any, @Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { access_token, refresh_token } = await this.authService.login(user);

    // Set Refresh Token in an HttpOnly Cookie
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'strict', // Protect against CSRF
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Return only access token in body
    return { access_token };
  }


  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() request: any, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies['refresh_token'];
    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }
    const { access_token, refresh_token: newRefreshToken } = await this.authService.refreshTokens(refreshToken);

    response.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token };
  }


  @Post('change-password')
  changePassword(@CurrentUser('id') userId: number, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
