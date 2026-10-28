import { Injectable } from '@nestjs/common';
import {
  emptyWordUpdateError,
  wordNotFoundError,
} from '../../common/errors/word-errors.js';
import type { ListAdminWordsQuery } from '../../common/interfaces/list-admin-words-query.interface.js';
import type { Paginated } from '../../common/interfaces/paginated.interface.js';
import type { WordSortField } from '../../common/interfaces/word-sort-field.type.js';
import type { WordInput } from '../../common/interfaces/word-input.interface.js';
import type { WordResponse } from '../../common/interfaces/word-response.interface.js';
import { toWordResponse } from '../../common/mappers/word.mapper.js';
import { toPaginated } from '../../common/utils/pagination.util.js';
import { parseSort } from '../../common/utils/sort.util.js';
import { WordsRepository } from '../words/words.repository.js';

@Injectable()
export class AdminWordsService {
  constructor(private readonly wordsRepository: WordsRepository) {}

  async list(query: ListAdminWordsQuery): Promise<Paginated<WordResponse>> {
    const [words, total] = await this.wordsRepository.findPage(
      query,
      parseSort<WordSortField>(query.sort),
    );
    return toPaginated(
      words.map(toWordResponse),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<WordResponse> {
    const word = await this.wordsRepository.findById(id);
    if (!word) {
      throw wordNotFoundError();
    }
    return toWordResponse(word);
  }

  async create(input: WordInput): Promise<WordResponse> {
    return toWordResponse(await this.wordsRepository.create(input));
  }

  async update(id: string, fields: Partial<WordInput>): Promise<WordResponse> {
    if (fields.content === undefined && fields.meaning === undefined) {
      throw emptyWordUpdateError();
    }
    const word = await this.wordsRepository.update(id, fields);
    if (!word) {
      throw wordNotFoundError();
    }
    return word;
  }

  async remove(id: string): Promise<void> {
    if (!(await this.wordsRepository.softDelete(id))) {
      throw wordNotFoundError();
    }
  }
}
