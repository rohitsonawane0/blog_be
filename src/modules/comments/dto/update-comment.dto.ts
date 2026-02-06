import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateCommentDto {
    @IsString()
    @IsOptional()
    @MinLength(1)
    @MaxLength(2000)
    content?: string;
}
