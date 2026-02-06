import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
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

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    tagIds?: string[];
}
