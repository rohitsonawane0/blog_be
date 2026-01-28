import { User } from "src/modules/users/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { BlogStatus } from "../enums/blog-status.enum";

@Entity()
export class Blog {
    @PrimaryGeneratedColumn()
    id: number;

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

    @Column({ nullable: true })
    authorId: number;
}
