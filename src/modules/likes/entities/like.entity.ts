import { User } from "src/modules/users/entities/user.entity";
import { Blog } from "src/modules/blogs/entities/blog.entity";
import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    Column
} from "typeorm";

@Entity()
@Unique(['blogId', 'userId']) // One like per blog per user
export class Like {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

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
