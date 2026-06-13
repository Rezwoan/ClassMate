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
import { ClassSessionsService } from './class-sessions.service';
import {
  CreateClassSessionDto,
  UpdateClassSessionDto,
} from './dto/class-session.dto';

@Controller('class-sessions')
export class ClassSessionsController {
  constructor(private readonly sessions: ClassSessionsService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateClassSessionDto) {
    return this.sessions.create(userId, dto);
  }

  @Get()
  list(
    @CurrentUser('userId') userId: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.sessions.list(userId, courseId);
  }

  @Patch(':id')
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClassSessionDto,
  ) {
    return this.sessions.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.sessions.remove(userId, id);
  }
}
