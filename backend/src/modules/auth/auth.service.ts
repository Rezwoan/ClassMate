import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateOtpCode, randomToken, sha256 } from '../../common/utils/crypto.util';
import { parseDurationMs } from '../../common/utils/time.util';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignupDto,
  VerifyOtpDto,
} from './dto/auth.dto';

export const OtpPurpose = {
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;
type OtpPurposeValue = (typeof OtpPurpose)[keyof typeof OtpPurpose];

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // ---------- Public flows ----------

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName,
        instituteName: dto.instituteName,
        studentId: dto.studentId,
        department: dto.department ?? null,
        timezone: dto.timezone ?? 'UTC',
        notificationPref: { create: {} },
      },
    });

    await this.issueOtp(user, OtpPurpose.EMAIL_VERIFY, 'verify your email');
    return {
      message: 'Account created. Check your email for a 6-digit verification code.',
      email: user.email,
    };
  }

  async verifyEmail(dto: VerifyOtpDto) {
    const user = await this.requireUser(dto.email);
    if (user.emailVerified) {
      throw new BadRequestException('Email already verified. Please log in.');
    }
    await this.consumeOtp(user, dto.code, OtpPurpose.EMAIL_VERIFY);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
    const tokens = await this.issueTokens(updated);
    return { ...tokens, user: this.safe(updated) };
  }

  async resendOtp(email: string) {
    const user = await this.requireUser(email);
    if (user.emailVerified) {
      throw new BadRequestException('Email already verified.');
    }
    await this.issueOtp(user, OtpPurpose.EMAIL_VERIFY, 'verify your email');
    return { message: 'A new verification code has been sent.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!user.emailVerified) {
      await this.issueOtp(user, OtpPurpose.EMAIL_VERIFY, 'verify your email');
      throw new ForbiddenException(
        'Your email is not verified. We sent you a new verification code.',
      );
    }
    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.safe(user) };
  }

  async refresh(rawToken: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(rawToken) },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    // Rotate: revoke the used token, issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.issueTokens(record.user);
    return { ...tokens, user: this.safe(record.user) };
  }

  async logout(rawToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (user) {
      await this.issueOtp(user, OtpPurpose.PASSWORD_RESET, 'reset your password');
    }
    // Always generic to avoid leaking which emails are registered.
    return { message: 'If an account exists for that email, a reset code has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.requireUser(dto.email);
    await this.consumeOtp(user, dto.code, OtpPurpose.PASSWORD_RESET);
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // Invalidate all sessions after a password change.
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Password updated. You can now log in.' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.safe(user);
  }

  // ---------- Helpers ----------

  private async issueTokens(user: User) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    const refreshToken = randomToken();
    const ttlMs = parseDurationMs(this.config.get<string>('JWT_REFRESH_TTL', '7d'));
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
    return { accessToken, refreshToken };
  }

  private async issueOtp(user: User, purpose: OtpPurposeValue, label: string) {
    // Invalidate any previous unconsumed codes for this purpose.
    await this.prisma.otpToken.updateMany({
      where: { userId: user.id, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = generateOtpCode(6);
    const codeHash = await bcrypt.hash(code, 10);
    const ttlMin = Number(this.config.get<string>('OTP_TTL_MINUTES', '10'));
    await this.prisma.otpToken.create({
      data: {
        userId: user.id,
        codeHash,
        purpose,
        expiresAt: new Date(Date.now() + ttlMin * 60_000),
      },
    });

    if (this.config.get<string>('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV OTP] ${user.email} (${purpose}): ${code}`);
    }
    await this.mail.sendOtp(user.email, user.fullName, code, label);
  }

  private async consumeOtp(user: User, code: string, purpose: OtpPurposeValue) {
    const token = await this.prisma.otpToken.findFirst({
      where: { userId: user.id, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) {
      throw new BadRequestException('No active code. Please request a new one.');
    }
    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Code expired. Please request a new one.');
    }
    const maxAttempts = Number(this.config.get<string>('OTP_MAX_ATTEMPTS', '5'));
    if (token.attempts >= maxAttempts) {
      await this.prisma.otpToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      });
      throw new BadRequestException('Too many attempts. Please request a new code.');
    }
    const ok = await bcrypt.compare(code, token.codeHash);
    if (!ok) {
      await this.prisma.otpToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid code.');
    }
    await this.prisma.otpToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });
  }

  private async requireUser(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) throw new NotFoundException('No account found for this email.');
    return user;
  }

  private safe(user: User): SafeUser {
    const { passwordHash: _omit, ...rest } = user;
    return rest;
  }
}
