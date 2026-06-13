import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        instituteName: dto.instituteName,
        studentId: dto.studentId,
        department: dto.department,
        timezone: dto.timezone,
      },
    });
    return this.safe(user);
  }

  private safe(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _omit, ...rest } = user;
    return rest;
  }
}
