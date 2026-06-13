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
import {
  CreateHomeworkDto,
  HomeworkStatus,
  UpdateHomeworkDto,
} from './dto/homework.dto';
import { HomeworkService } from './homework.service';

@Controller('homework')
export class HomeworkController {
  constructor(private readonly homework: HomeworkService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateHomeworkDto) {
    return this.homework.create(userId, dto);
  }

  @Get()
  list(
    @CurrentUser('userId') userId: string,
    @Query('courseId') courseId?: string,
    @Query('status') status?: HomeworkStatus,
  ) {
    return this.homework.list(userId, courseId, status);
  }

  @Patch(':id')
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHomeworkDto,
  ) {
    return this.homework.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.homework.remove(userId, id);
  }
}
