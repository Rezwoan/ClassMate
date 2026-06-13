import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [CoursesModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
