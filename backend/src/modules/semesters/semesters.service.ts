import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Semester } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';

@Injectable()
export class SemestersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSemesterDto): Promise<Semester> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after the start date.');
    }
    // A new semester becomes the active one.
    const [, semester] = await this.prisma.$transaction([
      this.prisma.semester.updateMany({ where: { userId }, data: { isActive: false } }),
      this.prisma.semester.create({
        data: { userId, name: dto.name, startDate, endDate, isActive: true },
      }),
    ]);
    return semester;
  }

  list(userId: string): Promise<Semester[]> {
    return this.prisma.semester.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  active(userId: string): Promise<Semester | null> {
    return this.prisma.semester.findFirst({
      where: { userId, isActive: true },
      orderBy: { startDate: 'desc' },
    });
  }

  get(userId: string, id: string): Promise<Semester> {
    return this.requireOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateSemesterDto): Promise<Semester> {
    await this.requireOwned(userId, id);
    if (dto.isActive === true) {
      await this.prisma.semester.updateMany({ where: { userId }, data: { isActive: false } });
    }
    return this.prisma.semester.update({
      where: { id },
      data: {
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async activate(userId: string, id: string): Promise<Semester> {
    await this.requireOwned(userId, id);
    await this.prisma.semester.updateMany({ where: { userId }, data: { isActive: false } });
    return this.prisma.semester.update({ where: { id }, data: { isActive: true } });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.semester.delete({ where: { id } });
    return { message: 'Semester deleted.' };
  }

  private async requireOwned(userId: string, id: string): Promise<Semester> {
    const semester = await this.prisma.semester.findFirst({ where: { id, userId } });
    if (!semester) throw new NotFoundException('Semester not found.');
    return semester;
  }
}
