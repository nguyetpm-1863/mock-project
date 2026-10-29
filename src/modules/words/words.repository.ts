import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, type EntityManager, In, Repository } from 'typeorm';
import { LESSON_WORDS_TABLE } from '../../common/constants/lesson.constants.js';
import { WORD_RETURNING_COLUMNS } from '../../common/constants/word.constants.js';
import type { WordInput } from '../../common/interfaces/word-input.interface.js';
import type { ListAdminWordsQuery } from '../../common/interfaces/list-admin-words-query.interface.js';
import type { ParsedSort } from '../../common/interfaces/parsed-sort.interface.js';
import type { WordResponse } from '../../common/interfaces/word-response.interface.js';
import type { WordSortField } from '../../common/interfaces/word-sort-field.type.js';
import {
  lowerColumn,
  lowerContainsPattern,
} from '../../common/utils/case-insensitive-search.util.js';
import { toSkip } from '../../common/utils/pagination.util.js';
import { Word } from './entities/word.entity.js';

@Injectable()
export class WordsRepository {
  constructor(
    @InjectRepository(Word)
    private readonly repository: Repository<Word>,
  ) {}

  findPage(
    { page, limit, keyword }: ListAdminWordsQuery,
    order: ParsedSort<WordSortField>,
  ): Promise<[Word[], number]> {
    const query = this.repository
      .createQueryBuilder('word')
      .orderBy(`word.${order.field}`, order.direction)
      .addOrderBy('word.id', 'ASC')
      .skip(toSkip(page, limit))
      .take(limit);
    if (keyword) {
      query.andWhere(
        new Brackets((search) =>
          search
            .where(`${lowerColumn('word.content')} LIKE :pattern`)
            .orWhere(`${lowerColumn('word.meaning')} LIKE :pattern`),
        ),
        { pattern: lowerContainsPattern(keyword) },
      );
    }
    return query.getManyAndCount();
  }

  findById(id: string): Promise<Word | null> {
    return this.repository.findOneBy({ id });
  }

  findByIds(ids: string[]): Promise<Word[]> {
    return this.repository.find({
      where: { id: In(ids) },
      order: { content: 'ASC' },
    });
  }

  findByLesson(lessonId: string): Promise<Word[]> {
    return this.repository
      .createQueryBuilder('word')
      .innerJoin(
        LESSON_WORDS_TABLE,
        'lessonWord',
        'lessonWord.word_id = word.id',
      )
      .where('lessonWord.lesson_id = :lessonId', { lessonId })
      .orderBy('word.content', 'ASC')
      .getMany();
  }

  create(
    input: WordInput,
    manager: EntityManager = this.repository.manager,
  ): Promise<Word> {
    const words = manager.getRepository(Word);
    return words.save(words.create(input), { transaction: false });
  }

  async update(
    id: string,
    fields: Partial<WordInput>,
    manager: EntityManager = this.repository.manager,
  ): Promise<WordResponse | null> {
    const { raw } = await manager
      .getRepository(Word)
      .createQueryBuilder()
      .update()
      .set(fields)
      .where('id = :id AND deleted_at IS NULL', { id })
      .returning(WORD_RETURNING_COLUMNS)
      .execute();
    const [word] = raw as WordResponse[];
    return word ?? null;
  }

  async softDelete(
    id: string,
    manager: EntityManager = this.repository.manager,
  ): Promise<boolean> {
    const { affected } = await manager
      .getRepository(Word)
      .createQueryBuilder()
      .softDelete()
      .where('id = :id AND deleted_at IS NULL', { id })
      .execute();
    return affected === 1;
  }
}
