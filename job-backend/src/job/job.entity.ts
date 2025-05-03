// src/job/job.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  company: string;

  @Column()
  location: string;

  @Column()
  jobType: string;

  @Column()
  salaryRange: string;

  @Column('text')
  description: string;

  @Column('text')
  requirements: string;

  @Column('text')
  responsibilities: string;

  @Column({ type: 'date' })
  deadline: string;
  
  @Column({ default: false })
  isDraft: boolean;
  
  @Column({ nullable: true })
  logo: string;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}