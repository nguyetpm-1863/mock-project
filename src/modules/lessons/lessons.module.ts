import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity.js';
import { LessonsRepository } from './lessons.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson])],
  providers: [LessonsRepository],
  exports: [LessonsRepository],
})
export class LessonsModule {}
