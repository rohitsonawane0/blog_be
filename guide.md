# Refresh Token with Cookies - Implementation Guide

This guide outlines how to implement Refresh Tokens using **HttpOnly Cookies** in NestJS. This is more secure than storing tokens in localStorage as it prevents XSS attacks from accessing the refresh token.

## 1. Install Dependencies

I have already installed these for you:
```bash
pnpm add cookie-parser @types/cookie-parser
```

## 2. Configure Middleware

Enable cookie parsing in your main application file.

**File:** `src/main.ts`

```typescript
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // Enable cookie parser
  // ... other configs
}
```

## 3. Update User Entity

Store the hashed refresh token in the database.

**File:** `src/modules/users/entities/user.entity.ts`

```typescript
@Column({ nullable: true })
currentHashedRefreshToken: string;
```

## 4. Update Auth Service

Modify `AuthService` to return tokens and handle the hashing.

**File:** `src/modules/auth/auth.service.ts`

```typescript
// ... imports

@Injectable()
export class AuthService {
  // ... constructor

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async getTokens(userId: number, email: string) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
      ),
    ]);

    return { access_token, refresh_token };
  }

  // ... updateRefreshToken, validateUser, hash, compare logic (same as before)
}
```

## 5. Update Auth Controller (The Cookie Part)

This is the most important part. We will send the `access_token` in the body and the `refresh_token` in a cookie.

**File:** `src/modules/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express'; // Import Response from express

// ... other imports

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { access_token, refresh_token } = await this.authService.login(loginDto);

    // Set Refresh Token in an HttpOnly Cookie
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'strict', // Protect against CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return only access token in body
    return { access_token };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    // Clear the cookie
    response.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }
}
```

## 6. Create Refresh Token Strategy (Cookie Extractor)

We need a strategy that specifically looks for the token in the *cookies*, not the header.

**File:** `src/modules/auth/strategies/refresh-token.strategy.ts`

```typescript
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token; 
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.cookies.refresh_token;
    return { ...payload, refreshToken };
  }
}
```

## 7. Protected Refresh Endpoint

Create the endpoint that uses the cookie to issue new tokens.

**File:** `src/modules/auth/auth.controller.ts`

```typescript
import { RefreshTokenGuard } from './guards/refresh-token.guard';

// ... inside AuthController

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(@Req() req, @Res({ passthrough: true }) response: Response) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    
    // Call service to get new tokens
    const { access_token, refresh_token: newRefreshToken } = 
      await this.authService.refreshTokens(userId, refreshToken);

    // Update the cookie with the new refresh token
    response.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token };
  }
```

## Summary
1.  **Main:** Enable `cookie-parser`.
2.  **Controller:** Use `@Res({ passthrough: true })` to set/clear cookies.
3.  **Strategy:** Use `ExtractJwt.fromExtractors` to read from `req.cookies`.
