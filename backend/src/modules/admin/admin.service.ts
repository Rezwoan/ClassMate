import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListUsersQueryDto, UpdateUserDto } from './dto/admin.dto';

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** High-level counts for the dashboard. */
  async stats() {
    const since = new Date(Date.now() - 7 * 86_400_000);
    const [
      users,
      verified,
      admins,
      newUsers,
      semesters,
      courses,
      classSessions,
      teachers,
      notes,
      noteImages,
      quizzes,
      homework,
      pushSubscriptions,
      imageBytes,
      recentUsers,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { emailVerified: true } }),
      this.prisma.user.count({ where: { isAdmin: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.semester.count(),
      this.prisma.course.count(),
      this.prisma.classSession.count(),
      this.prisma.teacher.count(),
      this.prisma.note.count(),
      this.prisma.noteImage.count(),
      this.prisma.quiz.count(),
      this.prisma.homework.count(),
      this.prisma.pushSubscription.count(),
      this.prisma.noteImage.aggregate({ _sum: { sizeBytes: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          email: true,
          fullName: true,
          emailVerified: true,
          isAdmin: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      users: { total: users, verified, admins, newLast7Days: newUsers },
      content: {
        semesters,
        courses,
        classSessions,
        teachers,
        notes,
        noteImages,
        quizzes,
        homework,
      },
      storage: { imageBytes: imageBytes._sum.sizeBytes ?? 0 },
      push: { subscriptions: pushSubscriptions },
      recentUsers,
    };
  }

  /** Paginated, searchable user list. */
  async listUsers(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const term = query.search?.trim();

    const where: Prisma.UserWhereInput = term
      ? {
          OR: [
            { email: { contains: term } },
            { fullName: { contains: term } },
            { studentId: { contains: term } },
            { instituteName: { contains: term } },
          ],
        }
      : {};

    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          fullName: true,
          instituteName: true,
          studentId: true,
          emailVerified: true,
          isAdmin: true,
          createdAt: true,
          _count: {
            select: { courses: true, notes: true, quizzes: true, homework: true },
          },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  }

  /** Full detail for one user (no password hash). */
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        instituteName: true,
        studentId: true,
        department: true,
        timezone: true,
        emailVerified: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            semesters: true,
            courses: true,
            classSessions: true,
            teachers: true,
            notes: true,
            quizzes: true,
            homework: true,
            pushSubscriptions: true,
          },
        },
        semesters: {
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isActive: true,
            _count: { select: { courses: true } },
          },
        },
        courses: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, code: true, color: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async updateUser(
    actingUserId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<SafeUser> {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found.');

    // Don't allow an admin to demote themselves (avoid self-lockout).
    if (dto.isAdmin === false && id === actingUserId) {
      throw new BadRequestException('You cannot remove your own admin access.');
    }
    // Never drop below one admin.
    if (dto.isAdmin === false && target.isAdmin) {
      const admins = await this.prisma.user.count({ where: { isAdmin: true } });
      if (admins <= 1) {
        throw new BadRequestException('At least one admin must remain.');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { emailVerified: dto.emailVerified, isAdmin: dto.isAdmin },
    });
    return this.safe(user);
  }

  async deleteUser(actingUserId: string, id: string) {
    if (id === actingUserId) {
      throw new ForbiddenException('You cannot delete your own account here.');
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found.');
    if (target.isAdmin) {
      const admins = await this.prisma.user.count({ where: { isAdmin: true } });
      if (admins <= 1) {
        throw new BadRequestException('Cannot delete the last admin.');
      }
    }
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted.' };
  }

  private safe(user: User): SafeUser {
    const { passwordHash: _omit, ...rest } = user;
    return rest;
  }
}
