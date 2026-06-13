import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { ClassSessionsController } from './class-sessions.controller';
import { ClassSessionsService } from './class-sessions.service';

@Module({
  imports: [CoursesModule],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsService],
})
export class ClassSessionsModule {}
