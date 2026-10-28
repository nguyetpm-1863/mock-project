import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  WORD_CONTENT_MAX_LENGTH,
  WORD_MEANING_MAX_LENGTH,
} from '../../../common/constants/word.constants.js';
import type { WordResponse } from '../../../common/interfaces/word-response.interface.js';

@Entity('words')
@Index('IDX_words_created_at', ['createdAt'])
export class Word implements WordResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: WORD_CONTENT_MAX_LENGTH })
  content: string;

  @Column({ type: 'varchar', length: WORD_MEANING_MAX_LENGTH })
  meaning: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
