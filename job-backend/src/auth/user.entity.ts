// src/auth/user.entity.ts
// `!` because TypeORM hydrates entities after construction.
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  /**
   * bcrypt hash. `select: false` keeps it out of every ordinary query, so a
   * user object cannot leak the hash by being returned from a controller.
   */
  @Column({ select: false })
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
