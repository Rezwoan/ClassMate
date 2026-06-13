import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

// Soft pastel palette assigned round-robin (matches docs/UI_UX.md).
const COURSE_PALETTE = [
  '#A7C7FF',
  '#FFD3A5',
  '#B5EAD7',
  '#FFB5C2',
  '#D7BDFF',
  '#FDE68A',
  '#9DECF9',
  '#C3F584',
];

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCourseDto): Promise<Course> {
    const semesterId = await this.resolveSemesterId(userId, dto.semesterId);
    const count = await this.prisma.course.count({ where: { userId, semesterId } });
    return this.prisma.course.create({
      data: {
        userId,
        semesterId,
        name: dto.name,
        code: dto.code ?? null,
        color: dto.color ?? COURSE_PALETTE[count % COURSE_PALETTE.length],
        credits: dto.credits ?? null,
      },
    });
  }

  async list(userId: string, semesterId?: string): Promise<Course[]> {
    const resolved = await this.resolveSemesterId(userId, semesterId, true);
    if (!resolved) return [];
    return this.prisma.course.findMany({
      where: { userId, semesterId: resolved },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { classSessions: true, quizzes: true, homework: true, notes: true } } },
    });
  }

  get(userId: string, id: string) {
    return this.requireOwnedDetailed(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateCourseDto): Promise<Course> {
    await this.requireOwned(userId, id);
    return this.prisma.course.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        color: dto.color,
        credits: dto.credits,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted.' };
  }

  // ---------- helpers ----------

  async requireOwned(userId: string, id: string): Promise<Course> {
    const course = await this.prisma.course.findFirst({ where: { id, userId } });
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }

  private async requireOwnedDetailed(userId: string, id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, userId },
      include: {
        classSessions: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        teachers: true,
        _count: { select: { quizzes: true, homework: true, notes: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }

  /**
   * Returns the given semester (verifying ownership) or the active semester.
   * When `allowNull` is false and no semester exists, throws.
   */
  private async resolveSemesterId(
    userId: string,
    semesterId: string | undefined,
    allowNull: true,
  ): Promise<string | null>;
  private async resolveSemesterId(
    userId: string,
    semesterId?: string,
    allowNull?: false,
  ): Promise<string>;
  private async resolveSemesterId(
    userId: string,
    semesterId: string | undefined,
    allowNull = false,
  ): Promise<string | null> {
    if (semesterId) {
      const owned = await this.prisma.semester.findFirst({
        where: { id: semesterId, userId },
        select: { id: true },
      });
      if (!owned) throw new NotFoundException('Semester not found.');
      return owned.id;
    }
    const active = await this.prisma.semester.findFirst({
      where: { userId, isActive: true },
      select: { id: true },
    });
    if (!active) {
      if (allowNull) return null;
      throw new BadRequestException(
        'No active semester. Complete onboarding or pass a semesterId.',
      );
    }
    return active.id;
  }
}
