---
description: How to implement reusable pagination across all APIs
---

# Reusable Pagination Pattern

## Existing Components

| File | Purpose |
|------|---------|
| `src/common/dto/pagination.dto.ts` | Query params validation (page, limit, search) |
| `src/common/interceptors/transform.interceptor.ts` | Auto-wraps `{ data, metadata }` into response |

---

## Create a Pagination Helper Utility

Create `src/common/utils/pagination.util.ts`:

```typescript
export interface PaginatedResult<T> {
  data: T[];
  metadata: {
    page: number;
    limit: number;
    currentPageCount: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data: items,
    metadata: {
      page,
      limit,
      currentPageCount: items.length,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

## Usage in Any Service

```typescript
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate } from 'src/common/utils/pagination.util';

async findAll(paginationDto: PaginationDto) {
  const { page = 1, limit = 10, search } = paginationDto;
  const skip = (page - 1) * limit;

  const [items, total] = await this.repository.findAndCount({
    where: { name: search ? Like(`%${search}%`) : undefined },
    skip,
    take: limit,
  });

  return paginate(items, total, page, limit);
}
```

---

## Usage in Controller

```typescript
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Get()
findAll(@Query() paginationDto: PaginationDto) {
  return this.service.findAll(paginationDto);
}
```

---

## Response Format

The `TransformInterceptor` automatically transforms the output to:

```json
{
  "status": true,
  "metadata": {
    "page": 1,
    "limit": 10,
    "currentPageCount": 5,
    "total": 100,
    "totalPages": 10
  },
  "data": [...]
}
```
