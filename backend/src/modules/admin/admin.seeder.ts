import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomToken } from '../../common/utils/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_ADMIN_EMAIL = 'frezwoan+admin@gmail.com';

/**
 * Guarantees an admin account exists on boot (idempotent).
 * - If the admin email has no account, one is created (verified) with a
 *   throwaway password — the operator sets a real one via "forgot password".
 *   In non-production a known dev password is used and logged for testing.
 * - If the account exists but isn't an admin, it is promoted.
 */
@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger('AdminSeeder');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const email = (
      this.config.get<string>('ADMIN_EMAIL') ?? DEFAULT_ADMIN_EMAIL
    ).toLowerCase();
    const isProd = this.config.get<string>('NODE_ENV') === 'production';

    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (!existing.isAdmin) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { isAdmin: true },
        });
        this.logger.log(`Promoted existing user to admin: ${email}`);
      }
      return;
    }

    const devPassword = 'AdminDev!2026';
    const password = isProd
      ? this.config.get<string>('ADMIN_PASSWORD') ?? randomToken(12)
      : this.config.get<string>('ADMIN_PASSWORD') ?? devPassword;

    await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        fullName: 'ClassMate Admin',
        instituteName: 'ClassMate',
        studentId: 'ADMIN',
        emailVerified: true,
        isAdmin: true,
        notificationPref: { create: {} },
      },
    });

    if (isProd) {
      this.logger.warn(
        `Created admin ${email}. Set a password via "Forgot password" (a code is emailed to that address).`,
      );
    } else {
      this.logger.warn(`Created admin ${email} with dev password: ${password}`);
    }
  }
}
