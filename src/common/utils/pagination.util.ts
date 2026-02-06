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