import { User } from "src/modules/users/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { BlogStatus } from "../enums/blog-status.enum";
import { Category } from "../../categories/entities/category.entity";
import { Tag } from "src/modules/tags/entities/tag.entity";

@Entity()
export class Blog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    title: string;

    @Column({ unique: true })
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ nullable: true })
    summary: string;

    @Column({ nullable: true })
    coverImage: string;

    @Column({ type: 'enum', enum: BlogStatus, default: BlogStatus.DRAFT })
    status: BlogStatus;

    @Column({ default: 0 })
    viewCount: number;

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ nullable: true })
    publishedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column({ nullable: true, type: 'uuid' })
    authorId: string;

    @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @Column({ nullable: true, type: 'uuid' })
    categoryId: string;

    @ManyToMany(() => Tag, (tag) => tag.blogs, { onDelete: 'SET NULL' })
    @JoinTable()
    tags: Tag[]
}
