import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { UserRole } from "src/common/enums/user-role.enum";
import { IS_PUBLIC_KEY } from "src/common/decorators/public.decorator";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        // 2. If no roles are required, allow access
        if (!requiredRoles) {
            return true;
        }
        const { user }: { user: JwtPayload } = context.switchToHttp().getRequest();
        if (!user) {
            return false;
        }

        // 5. Admin Access (Optional but recommended): Admins can access everything
        if (user.role === UserRole.admin) {
            return true;
        }

        // 6. Check if the user has one of the required roles
        return requiredRoles.some((role: UserRole) => user.role === role);
    }
}
