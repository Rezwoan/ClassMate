import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateCourseDto) {
    return this.courses.create(userId, dto);
  }

  @Get()
  list(
    @CurrentUser('userId') userId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.courses.list(userId, semesterId);
  }

  @Get(':id')
  get(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.courses.get(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courses.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.courses.remove(userId, id);
  }
}
