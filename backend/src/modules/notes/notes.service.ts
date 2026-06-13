import { Injectable, NotFoundException } from '@nestjs/common';
import { Note } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesService,
  ) {}

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    await this.courses.requireOwned(userId, dto.courseId);
    if (dto.classSessionId) {
      await this.requireSession(userId, dto.classSessionId, dto.courseId);
    }
    return this.prisma.note.create({
      data: {
        userId,
        courseId: dto.courseId,
        classSessionId: dto.classSessionId ?? null,
        title: dto.title,
        content: dto.content ?? '',
      },
    });
  }

  list(userId: string, courseId?: string, classSessionId?: string): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: {
        userId,
        ...(courseId ? { courseId } : {}),
        ...(classSessionId ? { classSessionId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: { course: { select: { name: true, code: true, color: true } } },
    });
  }

  get(userId: string, id: string) {
    return this.requireOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.requireOwned(userId, id);
    if (dto.classSessionId) {
      await this.requireSession(userId, dto.classSessionId, note.courseId);
    }
    return this.prisma.note.update({
      where: { id },
      data: {
        classSessionId: dto.classSessionId === undefined ? undefined : dto.classSessionId,
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.note.delete({ where: { id } });
    return { message: 'Note deleted.' };
  }

  private async requireOwned(userId: string, id: string): Promise<Note> {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found.');
    return note;
  }

  private async requireSession(userId: string, sessionId: string, courseId: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, userId, courseId },
      select: { id: true },
    });
    if (!session) {
      throw new NotFoundException('Class session not found for this course.');
    }
  }
}
