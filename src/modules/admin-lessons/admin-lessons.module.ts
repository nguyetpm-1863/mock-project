import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { LessonsModule } from '../lessons/lessons.module.js';
import { WordsModule } from '../words/words.module.js';
import { AdminLessonsController } from './admin-lessons.controller.js';
import { AdminLessonsService } from './admin-lessons.service.js';

@Module({
  imports: [AuthModule, LessonsModule, WordsModule],
  controllers: [AdminLessonsController],
  providers: [AdminLessonsService],
})
export class AdminLessonsModule {}
