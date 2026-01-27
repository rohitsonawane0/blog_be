import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    status: boolean;
    metadata: Record<string, any>;
    data: T;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(
            map((data) => {
                // If data is an object with strict 'data' and 'metadata' properties, pass them through
                if (
                    data &&
                    typeof data === 'object' &&
                    'data' in data &&
                    'metadata' in data
                ) {
                    return {
                        status: true,
                        metadata: data.metadata,
                        data: data.data,
                    };
                }

                return {
                    status: true,
                    metadata: {},
                    data: data,
                };
            }),
        );
    }
}
