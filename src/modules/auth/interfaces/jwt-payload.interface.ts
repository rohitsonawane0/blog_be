import { UserRole } from '../../../common/enums/user-role.enum';

export interface JwtPayload {
    id: number;
    email: string;
    role: UserRole;
}
