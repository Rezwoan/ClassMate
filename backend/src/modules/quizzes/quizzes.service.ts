import { Injectable, NotFoundException } from '@nestjs/common';
import { Quiz } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import { CreateQuizDto, UpdateQuizDto } from './dto/quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesService,
  ) {}

  async create(userId: string, dto: CreateQuizDto): Promise<Quiz> {
    await this.courses.requireOwned(userId, dto.courseId);
    return this.prisma.quiz.create({
      data: {
        userId,
        courseId: dto.courseId,
        title: dto.title,
        date: new Date(dto.date),
        topics: dto.topics ?? null,
      },
    });
  }

  list(userId: string, courseId?: string, upcoming?: boolean): Promise<Quiz[]> {
    return this.prisma.quiz.findMany({
      where: {
        userId,
        ...(courseId ? { courseId } : {}),
        ...(upcoming ? { date: { gte: new Date() } } : {}),
      },
      orderBy: { date: 'asc' },
      include: { course: { select: { name: true, code: true, color: true } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateQuizDto): Promise<Quiz> {
    await this.requireOwned(userId, id);
    // Changing the date means previous reminders no longer apply.
    const dateChanged = dto.date !== undefined;
    return this.prisma.quiz.update({
      where: { id },
      data: {
        title: dto.title,
        date: dto.date ? new Date(dto.date) : undefined,
        topics: dto.topics,
        ...(dateChanged
          ? { remindedWeekend: false, remindedDayBefore: false }
          : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.quiz.delete({ where: { id } });
    return { message: 'Quiz deleted.' };
  }

  private async requireOwned(userId: string, id: string): Promise<Quiz> {
    const quiz = await this.prisma.quiz.findFirst({ where: { id, userId } });
    if (!quiz) throw new NotFoundException('Quiz not found.');
    return quiz;
  }
}
