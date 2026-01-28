# Role-Based Access Control (RBAC) Implementation Guide

This guide walks you through implementing a secure Role-Based Access Control system in NestJS. We will create a custom decorator to specify allowed roles and a guard to enforce them.

## Prerequisites

Ensure you have your `UserRole` enum defined in `src/common/enums/user-role.enum.ts`.

```typescript
export enum UserRole {
    admin = 'admin',
    user = 'user',
}
```

---

## Step 1: Create the `@Roles` Decorator

We need a way to attach metadata to our route handlers indicating which roles are allowed access.

**File:** `src/common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

---

## Step 2: Create the `RolesGuard`

The guard will retrieve the roles required by the route (from the decorator) and compare them with the user's role (from the JWT token).

**File:** `src/common/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the required roles for this route/class
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // 3. Get the user object attached by JwtGuard
    const { user }: { user: JwtPayload } = context.switchToHttp().getRequest();

    // 4. If no user is present (e.g. public route logic failure), deny access
    if (!user) {
        return false;
    }

    // 5. Admin Access (Optional but recommended): Admins can access everything
    if (user.role === UserRole.admin) {
      return true;
    }

    // 6. Check if the user has one of the required roles
    return requiredRoles.some((role) => user.role === role);
  }
}
```

---

## Step 3: Register the Guard Globally

To ensure roles are checked on every request (after authentication), register the guard globally in `AppModule`.

**File:** `src/app.module.ts`

```typescript
// ... imports
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  // ...
  providers: [
    // ... other providers
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Registered AFTER JwtGuard
    },
  ],
})
export class AppModule {}
```

> **Important:** The order matters. `JwtGuard` must run *before* `RolesGuard` because `RolesGuard` relies on `request.user` being populated by the JWT strategy.

---

## Step 4: Protect Your Routes

Now you can use the `@Roles` decorator on any controller or specific route handler.

**Example: `src/modules/users/users.controller.ts`**

First, uncomment the controller methods you want to expose.

```typescript
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Only Admins can create users manually
  @Roles(UserRole.admin)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Only Admins can see the list of all users
  @Roles(UserRole.admin)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Any authenticated user can see a profile (RolesGuard allows if no @Roles present)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  // Only Admins can delete users
  @Roles(UserRole.admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

## How to Allow Multiple Roles

The `@Roles` decorator uses the rest parameter syntax (`...roles`), which allows you to pass as many roles as you want separated by commas.

**Example:**
To allow both **Admins** and **futureRole** users to access a route:

```typescript
// 1. Add the new role to your Enum
// src/common/enums/user-role.enum.ts
export enum UserRole {
    admin = 'admin',
    user = 'user',
    superUser = 'super_user', // New role
}

// 2. Pass multiple roles to the decorator
@Roles(UserRole.admin, UserRole.superUser)
@Get('special-data')
getSpecialData() {
  // accessible by Admin OR SuperUser
}
```

> **Note:** You do **not** need to pass an array like `[UserRole.admin]`. Just pass them as arguments: `@Roles(UserRole.admin, UserRole.user)`.
```

## Summary
1. Define **Roles** (`@Roles`).
2. Enforce **Rules** (`RolesGuard`).
3. Apply to **Routes** (Controller).
