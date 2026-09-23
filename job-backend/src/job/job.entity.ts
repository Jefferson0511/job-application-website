// src/job/job.entity.ts
// Fields carry `!` because TypeORM hydrates entities after construction, which
// the compiler cannot see under strictPropertyInitialization.
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../auth/user.entity';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  company!: string;

  @Column()
  location!: string;

  @Column()
  jobType!: string;

  @Column()
  salaryRange!: string;

  @Column('text')
  description!: string;

  @Column('text')
  requirements!: string;

  @Column('text')
  responsibilities!: string;

  @Column({ type: 'date' })
  deadline!: string;

  @Column({ default: false })
  isDraft!: boolean;

  @Column({ nullable: true })
  logo!: string;

  /**
   * Who may edit this posting. Nullable because postings created before
   * authentication existed have no owner; those are read-only through the API
   * until `npm run auth:claim-orphans` assigns them to an account.
   */
  @Index()
  @Column({ type: 'integer', nullable: true })
  ownerId!: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
