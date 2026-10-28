import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { WordsModule } from '../words/words.module.js';
import { AdminWordsController } from './admin-words.controller.js';
import { AdminWordsService } from './admin-words.service.js';

@Module({
  imports: [AuthModule, WordsModule],
  controllers: [AdminWordsController],
  providers: [AdminWordsService],
})
export class AdminWordsModule {}
