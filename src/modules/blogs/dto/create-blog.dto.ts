import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { BlogStatus } from "../enums/blog-status.enum";

export class CreateBlogDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(100)
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    summary?: string;

    @IsString()
    @IsOptional()
    coverImage?: string;

    @IsEnum(BlogStatus)
    @IsOptional()
    status?: BlogStatus;
}
