import { Injectable, NotFoundException } from '@nestjs/common';
import { Homework } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import {
  CreateHomeworkDto,
  HomeworkStatus,
  UpdateHomeworkDto,
} from './dto/homework.dto';

@Injectable()
export class HomeworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesService,
  ) {}

  async create(userId: string, dto: CreateHomeworkDto): Promise<Homework> {
    await this.courses.requireOwned(userId, dto.courseId);
    return this.prisma.homework.create({
      data: {
        userId,
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description ?? null,
        dueDate: new Date(dto.dueDate),
        status: dto.status ?? 'pending',
      },
    });
  }

  list(
    userId: string,
    courseId?: string,
    status?: HomeworkStatus,
  ): Promise<Homework[]> {
    return this.prisma.homework.findMany({
      where: {
        userId,
        ...(courseId ? { courseId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { dueDate: 'asc' },
      include: { course: { select: { name: true, code: true, color: true } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateHomeworkDto): Promise<Homework> {
    await this.requireOwned(userId, id);
    const dueChanged = dto.dueDate !== undefined;
    return this.prisma.homework.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        ...(dueChanged ? { remindedDue: false } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.homework.delete({ where: { id } });
    return { message: 'Homework deleted.' };
  }

  private async requireOwned(userId: string, id: string): Promise<Homework> {
    const homework = await this.prisma.homework.findFirst({ where: { id, userId } });
    if (!homework) throw new NotFoundException('Homework not found.');
    return homework;
  }
}
