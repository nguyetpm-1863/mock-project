import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import {
  LESSON_RETURNING_COLUMNS,
  LESSON_WORDS_TABLE,
} from '../../common/constants/lesson.constants.js';
import type { LessonFields } from '../../common/interfaces/lesson-fields.interface.js';
import type { LessonResponse } from '../../common/interfaces/lesson-response.interface.js';
import type { LessonSortField } from '../../common/interfaces/lesson-sort-field.type.js';
import type { ListAdminLessonsQuery } from '../../common/interfaces/list-admin-lessons-query.interface.js';
import type { ParsedSort } from '../../common/interfaces/parsed-sort.interface.js';
import {
  lowerColumn,
  lowerContainsPattern,
} from '../../common/utils/case-insensitive-search.util.js';
import { toSkip } from '../../common/utils/pagination.util.js';
import { Lesson } from './entities/lesson.entity.js';

@Injectable()
export class LessonsRepository {
  constructor(
    @InjectRepository(Lesson)
    private readonly repository: Repository<Lesson>,
  ) {}

  findPage(
    { page, limit, keyword }: ListAdminLessonsQuery,
    order: ParsedSort<LessonSortField>,
  ): Promise<[Lesson[], number]> {
    const query = this.repository
      .createQueryBuilder('lesson')
      .orderBy(`lesson.${order.field}`, order.direction)
      .addOrderBy('lesson.id', 'ASC')
      .skip(toSkip(page, limit))
      .take(limit);
    if (keyword) {
      query.andWhere(`${lowerColumn('lesson.title')} LIKE :pattern`, {
        pattern: lowerContainsPattern(keyword),
      });
    }
    return query.getManyAndCount();
  }

  findWithWords(id: string): Promise<Lesson | null> {
    return this.repository
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.words', 'word')
      .where('lesson.id = :id', { id })
      .orderBy('word.content', 'ASC')
      .getOne();
  }

  create(fields: LessonFields, manager: EntityManager): Promise<Lesson> {
    const lessons = manager.getRepository(Lesson);
    return lessons.save(lessons.create(fields), { transaction: false });
  }

  async update(
    id: string,
    fields: Partial<LessonFields>,
    manager: EntityManager = this.repository.manager,
  ): Promise<LessonResponse | null> {
    const { raw } = await manager
      .getRepository(Lesson)
      .createQueryBuilder()
      .update()
      .set(fields)
      .where('id = :id AND deleted_at IS NULL', { id })
      .returning(LESSON_RETURNING_COLUMNS)
      .execute();
    const [lesson] = raw as LessonResponse[];
    return lesson ?? null;
  }

  async addWords(
    lessonId: string,
    wordIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    if (wordIds.length) {
      await manager
        .createQueryBuilder()
        .relation(Lesson, 'words')
        .of(lessonId)
        .add(wordIds);
    }
  }

  async replaceWords(
    lessonId: string,
    wordIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .delete()
      .from(LESSON_WORDS_TABLE)
      .where('lesson_id = :lessonId', { lessonId })
      .execute();
    await this.addWords(lessonId, wordIds, manager);
  }

  async softDelete(id: string): Promise<boolean> {
    const { affected } = await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('id = :id AND deleted_at IS NULL', { id })
      .execute();
    return affected === 1;
  }
}
