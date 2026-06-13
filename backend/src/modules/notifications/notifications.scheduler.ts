import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  addDays,
  formatYmd,
  getZonedNow,
  occurrenceNumber,
  timeToMinutes,
  toUtcMidnight,
} from '../../common/utils/schedule.util';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const courseSelect = { select: { name: true, code: true } };

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger('NotificationsScheduler');

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Fires pre-class reminders within the lead-time window. */
  @Cron(CronExpression.EVERY_MINUTE)
  async classReminders(): Promise<void> {
    const users = await this.prisma.user.findMany({
      include: { notificationPref: true },
    });

    for (const user of users) {
      const pref = user.notificationPref;
      if (!pref?.classReminderEnabled) continue;
      if (!pref.pushEnabled && !pref.emailForClasses) continue;

      const now = getZonedNow(user.timezone);
      const semester = await this.prisma.semester.findFirst({
        where: { userId: user.id, isActive: true },
      });
      if (!semester) continue;
      const semStart = toUtcMidnight(semester.startDate);
      const semEnd = toUtcMidnight(semester.endDate);
      if (now.utcMidnight < semStart || now.utcMidnight > semEnd) continue;

      const sessions = await this.prisma.classSession.findMany({
        where: { userId: user.id, dayOfWeek: now.weekday },
        include: { course: courseSelect },
      });

      for (const session of sessions) {
        const startMin = timeToMinutes(session.startTime);
        const remindAt = startMin - pref.classReminderMinutesBefore;
        // Fire once the lead-time window opens, before class actually starts.
        if (now.minutesOfDay >= remindAt && now.minutesOfDay < startMin) {
          const classNumber = occurrenceNumber(semStart, now.utcMidnight, now.weekday);
          await this.notifications
            .dispatchClassReminder(user, pref, session, classNumber, formatYmd(now.utcMidnight))
            .catch((e) => this.logger.warn(`class reminder failed: ${e}`));
        }
      }
    }
  }

  /**
   * Morning digest (runs every 30 min, acts only during the user's local 9 AM
   * hour): weekend quiz study reminders, day-before quiz reminders, and
   * homework-due reminders. Per-row flags prevent duplicates.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async morningDigest(): Promise<void> {
    const users = await this.prisma.user.findMany({
      include: { notificationPref: true },
    });

    for (const user of users) {
      const pref = user.notificationPref;
      if (!pref) continue;
      const now = getZonedNow(user.timezone);
      if (Math.floor(now.minutesOfDay / 60) !== 9) continue; // ~9 AM local only

      const tomorrowYmd = formatYmd(addDays(now.utcMidnight, 1));

      // ----- Quizzes -----
      if (pref.quizWeekendReminder || pref.quizDayBeforeReminder) {
        const horizon = addDays(now.utcMidnight, 8);
        const quizzes = await this.prisma.quiz.findMany({
          where: { userId: user.id, date: { gte: now.utcMidnight, lte: horizon } },
          include: { course: courseSelect },
        });
        for (const quiz of quizzes) {
          const quizYmd = formatYmd(toUtcMidnight(quiz.date));
          // Day-before takes precedence over the weekend nudge.
          if (
            pref.quizDayBeforeReminder &&
            !quiz.remindedDayBefore &&
            quizYmd === tomorrowYmd
          ) {
            await this.notifications
              .dispatchQuizReminder(user, pref, quiz, 'DAY_BEFORE')
              .catch((e) => this.logger.warn(`quiz day-before failed: ${e}`));
          } else if (
            pref.quizWeekendReminder &&
            !quiz.remindedWeekend &&
            now.weekday === 6 // Saturday
          ) {
            await this.notifications
              .dispatchQuizReminder(user, pref, quiz, 'WEEKEND')
              .catch((e) => this.logger.warn(`quiz weekend failed: ${e}`));
          }
        }
      }

      // ----- Homework -----
      if (pref.homeworkReminderEnabled) {
        const horizon = addDays(now.utcMidnight, pref.homeworkReminderDaysBefore + 1);
        const homework = await this.prisma.homework.findMany({
          where: {
            userId: user.id,
            status: { not: 'submitted' },
            remindedDue: false,
            dueDate: { gte: now.utcMidnight, lte: horizon },
          },
          include: { course: courseSelect },
        });
        for (const hw of homework) {
          const daysUntil = Math.round(
            (toUtcMidnight(hw.dueDate).getTime() - now.utcMidnight.getTime()) / 86_400_000,
          );
          if (daysUntil <= pref.homeworkReminderDaysBefore) {
            await this.notifications
              .dispatchHomeworkReminder(user, pref, hw)
              .catch((e) => this.logger.warn(`homework reminder failed: ${e}`));
          }
        }
      }
    }
  }
}
