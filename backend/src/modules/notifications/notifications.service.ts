import { Injectable, Logger } from '@nestjs/common';
import {
  ClassSession,
  Course,
  Homework,
  NotificationPreference,
  Quiz,
  User,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SubscribeDto, UpdatePreferenceDto } from './dto/notifications.dto';
import { WebPushService } from './web-push.service';

type WithCourse<T> = T & { course: Pick<Course, 'name' | 'code'> };

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
    private readonly mail: MailService,
  ) {}

  // ---------- preferences ----------

  async getPreferences(userId: string): Promise<NotificationPreference> {
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (existing) return existing;
    return this.prisma.notificationPreference.create({ data: { userId } });
  }

  async updatePreferences(userId: string, dto: UpdatePreferenceDto) {
    await this.getPreferences(userId);
    return this.prisma.notificationPreference.update({
      where: { userId },
      data: { ...dto },
    });
  }

  // ---------- subscriptions ----------

  async subscribe(userId: string, dto: SubscribeDto) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent ?? null,
      },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent ?? null,
      },
    });
    await this.updatePreferences(userId, { pushEnabled: true });
    return { message: 'Subscribed to push notifications.' };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    const remaining = await this.prisma.pushSubscription.count({ where: { userId } });
    if (remaining === 0) {
      await this.updatePreferences(userId, { pushEnabled: false });
    }
    return { message: 'Unsubscribed.' };
  }

  async sendTest(userId: string) {
    const delivered = await this.webPush.sendToUser(userId, {
      title: '🔔 ClassMate test',
      body: 'Nice! Push notifications are working. You will get reminders here.',
      url: '/settings',
      tag: 'test',
    });
    return {
      pushConfigured: this.webPush.isConfigured,
      delivered,
      message:
        delivered > 0
          ? `Test notification sent to ${delivered} device(s).`
          : 'No active subscriptions reached. Enable notifications first.',
    };
  }

  // ---------- dispatch (used by the scheduler) ----------

  async dispatchClassReminder(
    user: User,
    pref: NotificationPreference,
    session: WithCourse<ClassSession>,
    classNumber: number,
    dateStr: string,
  ) {
    const courseLabel = session.course.code || session.course.name;
    const title = `Class soon — ${courseLabel}`;
    const body = `Class ${classNumber} of ${session.course.name} starts at ${session.startTime}${
      session.room ? ` in ${session.room}` : ''
    }.`;
    const refKey = `class:${session.id}:${dateStr}`;

    if (pref.pushEnabled) {
      await this.once(user.id, 'CLASS', refKey, 'PUSH', () =>
        this.webPush.sendToUser(user.id, { title, body, url: '/' }),
      );
    }
    if (pref.emailForClasses) {
      await this.once(user.id, 'CLASS', refKey, 'EMAIL', () =>
        this.mail.sendReminder(user.email, title, title, body),
      );
    }
  }

  async dispatchQuizReminder(
    user: User,
    pref: NotificationPreference,
    quiz: WithCourse<Quiz>,
    kind: 'WEEKEND' | 'DAY_BEFORE',
  ) {
    const weekend = kind === 'WEEKEND';
    const title = weekend ? 'Quiz this week 📚' : 'Quiz tomorrow ✏️';
    const when = fmtDate(quiz.date);
    const body = `${quiz.title} for ${quiz.course.name} is ${
      weekend ? `coming up on ${when}` : `tomorrow (${when})`
    }.${quiz.topics ? ` Topics: ${quiz.topics}.` : ''}${
      weekend ? ' Set aside time to study this weekend!' : ''
    }`;

    if (pref.pushEnabled) {
      await this.webPush.sendToUser(user.id, { title, body, url: '/quizzes' });
    }
    if (pref.emailForQuizzes) {
      await this.mail.sendReminder(user.email, title, title, body);
    }

    await this.prisma.quiz.update({
      where: { id: quiz.id },
      data: weekend ? { remindedWeekend: true } : { remindedDayBefore: true },
    });
  }

  async dispatchHomeworkReminder(
    user: User,
    pref: NotificationPreference,
    hw: WithCourse<Homework>,
  ) {
    const title = 'Assignment due soon 📌';
    const body = `${hw.title} for ${hw.course.name} is due ${fmtDate(hw.dueDate)}.`;

    if (pref.pushEnabled) {
      await this.webPush.sendToUser(user.id, { title, body, url: '/homework' });
    }
    if (pref.emailForHomework) {
      await this.mail.sendReminder(user.email, title, title, body);
    }

    await this.prisma.homework.update({
      where: { id: hw.id },
      data: { remindedDue: true },
    });
  }

  /** Runs `fn` only if this (user, type, refKey, channel) hasn't fired before. */
  private async once(
    userId: string,
    type: string,
    refKey: string,
    channel: string,
    fn: () => Promise<unknown>,
  ): Promise<void> {
    const existing = await this.prisma.notificationLog.findUnique({
      where: { userId_type_refKey_channel: { userId, type, refKey, channel } },
    });
    if (existing) return;
    await fn();
    await this.prisma.notificationLog
      .create({ data: { userId, type, refKey, channel } })
      .catch(() => undefined);
  }
}
