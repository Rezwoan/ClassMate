import { Injectable, NotFoundException } from '@nestjs/common';
import { Teacher } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesService,
  ) {}

  async create(userId: string, dto: CreateTeacherDto): Promise<Teacher> {
    await this.courses.requireOwned(userId, dto.courseId);
    return this.prisma.teacher.create({
      data: {
        userId,
        courseId: dto.courseId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        officeRoom: dto.officeRoom ?? null,
        officeHours: dto.officeHours ?? null,
      },
    });
  }

  list(userId: string, courseId?: string): Promise<Teacher[]> {
    return this.prisma.teacher.findMany({
      where: { userId, ...(courseId ? { courseId } : {}) },
      orderBy: { createdAt: 'asc' },
      include: { course: { select: { name: true, code: true, color: true } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateTeacherDto): Promise<Teacher> {
    await this.requireOwned(userId, id);
    return this.prisma.teacher.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        officeRoom: dto.officeRoom,
        officeHours: dto.officeHours,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.teacher.delete({ where: { id } });
    return { message: 'Teacher deleted.' };
  }

  private async requireOwned(userId: string, id: string): Promise<Teacher> {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, userId } });
    if (!teacher) throw new NotFoundException('Teacher not found.');
    return teacher;
  }
}
