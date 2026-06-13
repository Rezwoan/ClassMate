import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

@Module({
  imports: [CoursesModule],
  controllers: [TeachersController],
  providers: [TeachersService],
})
export class TeachersModule {}
