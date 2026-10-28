import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AdminOnly } from '../../common/decorators/admin-only.decorator.js';
import { noCacheResponse } from '../../common/decorators/no-cache-response.decorator.js';
import { ApiErrorsResponseDto } from '../../common/dto/api-errors-response.dto.js';
import { WordResponseDto } from '../../common/dto/word-response.dto.js';
import { AdminWordsService } from './admin-words.service.js';
import { CreateWordDto } from './dto/create-word.dto.js';
import { ListAdminWordsQueryDto } from './dto/list-admin-words-query.dto.js';
import { UpdateWordDto } from './dto/update-word.dto.js';
import { WordsPageDto } from './dto/words-page.dto.js';

@ApiTags('admin/words')
@Controller('admin/words')
@AdminOnly()
export class AdminWordsController {
  constructor(private readonly adminWordsService: AdminWordsService) {}

  @Get()
  @noCacheResponse()
  @ApiOperation({ summary: 'List words with pagination, search and sort' })
  @ApiOkResponse({ type: WordsPageDto })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed',
  })
  list(@Query() query: ListAdminWordsQueryDto): Promise<WordsPageDto> {
    return this.adminWordsService.list(query);
  }

  @Get(':id')
  @noCacheResponse()
  @ApiOperation({ summary: 'Get a word' })
  @ApiOkResponse({ type: WordResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorsResponseDto,
    description: 'Id is not a UUID',
  })
  @ApiNotFoundResponse({
    type: ApiErrorsResponseDto,
    description: 'Word not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WordResponseDto> {
    return this.adminWordsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a word' })
  @ApiCreatedResponse({ type: WordResponseDto })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed',
  })
  create(@Body() dto: CreateWordDto): Promise<WordResponseDto> {
    return this.adminWordsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the content and/or meaning of a word' })
  @ApiOkResponse({ type: WordResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorsResponseDto,
    description: 'Id is not a UUID',
  })
  @ApiNotFoundResponse({
    type: ApiErrorsResponseDto,
    description: 'Word not found',
  })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWordDto,
  ): Promise<WordResponseDto> {
    return this.adminWordsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a word' })
  @ApiNoContentResponse({ description: 'Word deleted' })
  @ApiBadRequestResponse({
    type: ApiErrorsResponseDto,
    description: 'Id is not a UUID',
  })
  @ApiNotFoundResponse({
    type: ApiErrorsResponseDto,
    description: 'Word not found',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.adminWordsService.remove(id);
  }
}
