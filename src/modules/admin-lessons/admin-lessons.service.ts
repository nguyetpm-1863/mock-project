import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  lessonNotFoundError,
  unknownWordsError,
} from '../../common/errors/lesson-errors.js';
import type { LessonDetailResponse } from '../../common/interfaces/lesson-detail-response.interface.js';
import type { LessonFields } from '../../common/interfaces/lesson-fields.interface.js';
import type { LessonInput } from '../../common/interfaces/lesson-input.interface.js';
import type { LessonResponse } from '../../common/interfaces/lesson-response.interface.js';
import type { LessonSortField } from '../../common/interfaces/lesson-sort-field.type.js';
import type { ListAdminLessonsQuery } from '../../common/interfaces/list-admin-lessons-query.interface.js';
import type { Paginated } from '../../common/interfaces/paginated.interface.js';
import type { WordResponse } from '../../common/interfaces/word-response.interface.js';
import {
  toLessonDetail,
  toLessonResponse,
} from '../../common/mappers/lesson.mapper.js';
import { toPaginated } from '../../common/utils/pagination.util.js';
import { parseSort } from '../../common/utils/sort.util.js';
import { LessonsRepository } from '../lessons/lessons.repository.js';
import { WordsRepository } from '../words/words.repository.js';

@Injectable()
export class AdminLessonsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly lessonsRepository: LessonsRepository,
    private readonly wordsRepository: WordsRepository,
  ) {}

  async list(query: ListAdminLessonsQuery): Promise<Paginated<LessonResponse>> {
    const [lessons, total] = await this.lessonsRepository.findPage(
      query,
      parseSort<LessonSortField>(query.sort),
    );
    return toPaginated(
      lessons.map(toLessonResponse),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<LessonDetailResponse> {
    const lesson = await this.lessonsRepository.findWithWords(id);
    if (!lesson) {
      throw lessonNotFoundError();
    }
    return toLessonDetail(lesson, lesson.words);
  }

  async create({
    wordIds = [],
    ...fields
  }: LessonInput): Promise<LessonDetailResponse> {
    const words = await this.findWords(wordIds);
    const lesson = await this.dataSource.transaction(async (manager) => {
      const created = await this.lessonsRepository.create(fields, manager);
      await this.lessonsRepository.addWords(created.id, wordIds, manager);
      return created;
    });
    return toLessonDetail(lesson, words);
  }

  async update(
    id: string,
    { wordIds, ...fields }: Partial<LessonInput>,
  ): Promise<LessonDetailResponse> {
    if (wordIds === undefined) {
      return this.updateFields(id, fields);
    }
    const words = await this.findWords(wordIds);
    const lesson = await this.dataSource.transaction(async (manager) => {
      const updated = await this.lessonsRepository.update(id, fields, manager);
      if (!updated) {
        throw lessonNotFoundError();
      }
      await this.lessonsRepository.replaceWords(id, wordIds, manager);
      return updated;
    });
    return toLessonDetail(lesson, words);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.lessonsRepository.softDelete(id))) {
      throw lessonNotFoundError();
    }
  }

  private async updateFields(
    id: string,
    fields: Partial<LessonFields>,
  ): Promise<LessonDetailResponse> {
    const [lesson, words] = await Promise.all([
      this.lessonsRepository.update(id, fields),
      this.wordsRepository.findByLesson(id),
    ]);
    if (!lesson) {
      throw lessonNotFoundError();
    }
    return toLessonDetail(lesson, words);
  }

  private async findWords(wordIds: string[]): Promise<WordResponse[]> {
    if (!wordIds.length) {
      return [];
    }
    const words = await this.wordsRepository.findByIds(wordIds);
    if (words.length !== wordIds.length) {
      throw unknownWordsError();
    }
    return words;
  }
}
