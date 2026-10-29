import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  LESSON_DESCRIPTION_MAX_LENGTH,
  LESSON_TITLE_MAX_LENGTH,
  LESSON_WORDS_TABLE,
} from '../../../common/constants/lesson.constants.js';
import type { LessonResponse } from '../../../common/interfaces/lesson-response.interface.js';
import { Word } from '../../words/entities/word.entity.js';

@Entity('lessons')
@Index('IDX_lessons_created_at', ['createdAt'])
export class Lesson implements LessonResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: LESSON_TITLE_MAX_LENGTH })
  title: string;

  @Column({
    type: 'varchar',
    length: LESSON_DESCRIPTION_MAX_LENGTH,
    nullable: true,
  })
  description: string | null;

  @ManyToMany(() => Word)
  @JoinTable({
    name: LESSON_WORDS_TABLE,
    joinColumn: { name: 'lesson_id' },
    inverseJoinColumn: { name: 'word_id' },
  })
  words: Word[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
