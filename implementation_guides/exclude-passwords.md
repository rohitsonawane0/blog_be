# Guide: Excluding Passwords from API Responses

Currently, when we fetch users (`GET /users` or `GET /users/:id`), the `password` field (even if hashed) is included in the response. This is a security risk. We need to automatically exclude it using NestJS Serialization.

## Step 1: Install `class-transformer` (If not already installed)

Check `package.json`. It is usually installed by default in NestJS projects, but ensure it is there.
If not: `npm install class-transformer`

## Step 2: Register the `ClassSerializerInterceptor` Globally

We need to tell NestJS to apply serialization rules globally.

**File:** `src/main.ts`

```typescript
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// ... other imports

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // existing pipes/filters...
  
  // ADD THIS LINE:
  app.useGlobalInterceptors(
    new TransformInterceptor(), // Your existing wrapper
    new ClassSerializerInterceptor(app.get(Reflector)) // standard simple serialization
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

>*Note: Alternatively, you can register it in `app.module.ts` providers, similar to how we did with `APP_GUARD`.*

## Step 3: Decorate the User Entity

Now we need to mark the `password` column as excluded.

**File:** `src/modules/users/entities/user.entity.ts`

1.  Import `Exclude` from `class-transformer`.
2.  Add `@Exclude()` decorator to the `password` property.

```typescript
import { Exclude } from 'class-transformer';
// ... other imports

@Entity()
export class User {
    // ...

    @Column({ nullable: true })
    @Exclude() // <--- ADD THIS
    password: string;

    // ...
}
```

## Step 4: Verification

1.  Restart the server.
2.  Hit `GET /users`.
3.  Confirm that the `password` field is **missing** from the response object.
