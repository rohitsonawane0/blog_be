import { IsNotEmpty, IsUUID } from "class-validator";

export class ToggleLikeDto {
    @IsUUID()
    @IsNotEmpty()
    blogId: string;
}
