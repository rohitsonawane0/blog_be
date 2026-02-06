import { IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateTagDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;

    @IsString()
    @IsOptional()
    @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: 'Color must be a valid hex color (e.g., #FF5733)',
    })
    color?: string;
}