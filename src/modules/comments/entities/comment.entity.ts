import { User } from "src/modules/users/entities/user.entity";
import { Blog } from "src/modules/blogs/entities/blog.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn
} from "typeorm";

@Entity()
@Unique(['blogId', 'userId']) // One comment per blog per user
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ default: false })
    isHidden: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Blog, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'blogId' })
    blog: Blog;

    @Column({ type: 'uuid' })
    blogId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid' })
    userId: string;
}
