import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Word } from './entities/word.entity.js';
import { WordsRepository } from './words.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Word])],
  providers: [WordsRepository],
  exports: [WordsRepository],
})
export class WordsModule {}
