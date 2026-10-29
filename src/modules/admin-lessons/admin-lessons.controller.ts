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
import { LessonDetailResponseDto } from '../../common/dto/lesson-detail-response.dto.js';
import { AdminLessonsService } from './admin-lessons.service.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { ListAdminLessonsQueryDto } from './dto/list-admin-lessons-query.dto.js';
import { UpdateLessonDto } from './dto/update-lesson.dto.js';
import { LessonsPageDto } from './dto/lessons-page.dto.js';

@ApiTags('admin/lessons')
@Controller('admin/lessons')
@AdminOnly()
export class AdminLessonsController {
  constructor(private readonly adminLessonsService: AdminLessonsService) {}

  @Get()
  @noCacheResponse()
  @ApiOperation({ summary: 'List lessons with pagination, search and sort' })
  @ApiOkResponse({ type: LessonsPageDto })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed',
  })
  list(@Query() query: ListAdminLessonsQueryDto): Promise<LessonsPageDto> {
    return this.adminLessonsService.list(query);
  }

  @Get(':id')
  @noCacheResponse()
  @ApiOperation({ summary: 'Get a lesson with its words' })
  @ApiOkResponse({ type: LessonDetailResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorsResponseDto,
    description: 'Id is not a UUID',
  })
  @ApiNotFoundResponse({
    type: ApiErrorsResponseDto,
    description: 'Lesson not found',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LessonDetailResponseDto> {
    return this.adminLessonsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a lesson and attach words in one transaction',
  })
  @ApiCreatedResponse({ type: LessonDetailResponseDto })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed or some words do not exist',
  })
  create(@Body() dto: CreateLessonDto): Promise<LessonDetailResponseDto> {
    return this.adminLessonsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lesson; wordIds replaces its words' })
  @ApiOkResponse({ type: LessonDetailResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorsResponseDto,
    description: 'Id is not a UUID',
  })
  @ApiNotFoundResponse({
    type: ApiErrorsResponseDto,
    description: 'Lesson not found',
  })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed or some words do not exist',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
  ): Promise<LessonDetailResponseDto> {
    return this.adminLessonsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a lesson' })
  @ApiNoContentResponse({ description: 'Lesson deleted' })
  @ApiBadRequestResponse({
    type: ApiErrorsResponseDto,
    description: 'Id is not a UUID',
  })
  @ApiNotFoundResponse({
    type: ApiErrorsResponseDto,
    description: 'Lesson not found',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.adminLessonsService.remove(id);
  }
}
