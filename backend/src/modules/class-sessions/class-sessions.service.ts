import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClassSession } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import {
  CreateClassSessionDto,
  UpdateClassSessionDto,
} from './dto/class-session.dto';

@Injectable()
export class ClassSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesService,
  ) {}

  async create(userId: string, dto: CreateClassSessionDto): Promise<ClassSession> {
    await this.courses.requireOwned(userId, dto.courseId);
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('endTime must be after startTime.');
    }
    return this.prisma.classSession.create({
      data: {
        userId,
        courseId: dto.courseId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room ?? null,
        label: dto.label ?? null,
      },
    });
  }

  list(userId: string, courseId?: string): Promise<ClassSession[]> {
    return this.prisma.classSession.findMany({
      where: { userId, ...(courseId ? { courseId } : {}) },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { course: { select: { name: true, code: true, color: true } } },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateClassSessionDto,
  ): Promise<ClassSession> {
    const existing = await this.requireOwned(userId, id);
    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('endTime must be after startTime.');
    }
    return this.prisma.classSession.update({
      where: { id },
      data: {
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
        label: dto.label,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.classSession.delete({ where: { id } });
    return { message: 'Class session deleted.' };
  }

  private async requireOwned(userId: string, id: string): Promise<ClassSession> {
    const session = await this.prisma.classSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw new NotFoundException('Class session not found.');
    return session;
  }
}
