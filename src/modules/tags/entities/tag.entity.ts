import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToMany,
} from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';

@Entity('tags')
export class Tag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 50 })
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ nullable: true, length: 255 })
    description: string;

    @Column({ nullable: true })
    color: string; // Hex color for UI display (e.g., "#FF5733")

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    // Many-to-Many relationship with Blog 00
    @ManyToMany(() => Blog, (blog) => blog.tags)
    blogs: Blog[];
}