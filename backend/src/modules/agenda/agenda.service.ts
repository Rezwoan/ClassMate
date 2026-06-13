import { Injectable } from '@nestjs/common';
import { ClassSession, Course } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  addDays,
  formatYmd,
  getZonedNow,
  occurrenceNumber,
  timeToMinutes,
  toUtcMidnight,
  ZonedNow,
} from '../../common/utils/schedule.util';

type SessionWithCourse = ClassSession & {
  course: Pick<Course, 'name' | 'code' | 'color'>;
};

interface SessionView {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string | null;
  color: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  label: string | null;
}

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everything the home screen needs in one call. */
  async home(userId: string, refDate?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const tz = user?.timezone || 'UTC';
    const now = getZonedNow(tz);

    const semester = await this.prisma.semester.findFirst({
      where: { userId, isActive: true },
      orderBy: { startDate: 'desc' },
    });

    const emptyHome = {
      semester: null,
      today: formatYmd(now.utcMidnight),
      week: [] as unknown[],
      nextClass: null,
      upcomingQuizzes: [] as unknown[],
      dueHomework: [] as unknown[],
    };
    if (!semester) return emptyHome;

    const sessions = (await this.prisma.classSession.findMany({
      where: { userId },
      include: { course: { select: { name: true, code: true, color: true } } },
    })) as SessionWithCourse[];

    const semStart = toUtcMidnight(semester.startDate);
    const semEnd = toUtcMidnight(semester.endDate);

    const refMidnight = refDate
      ? toUtcMidnight(new Date(refDate))
      : now.utcMidnight;
    const week = this.buildWeek(sessions, refMidnight, now, semStart, semEnd);
    const nextClass = this.computeNextClass(sessions, now, semStart, semEnd);

    const horizon = addDays(now.utcMidnight, 14);
    const upcomingQuizzes = await this.prisma.quiz.findMany({
      where: { userId, date: { gte: new Date(), lte: horizon } },
      orderBy: { date: 'asc' },
      include: { course: { select: { name: true, code: true, color: true } } },
    });
    const dueHomework = await this.prisma.homework.findMany({
      where: {
        userId,
        status: { not: 'submitted' },
        dueDate: { gte: now.utcMidnight },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: { course: { select: { name: true, code: true, color: true } } },
    });

    return {
      semester,
      today: formatYmd(now.utcMidnight),
      week,
      nextClass,
      upcomingQuizzes,
      dueHomework,
    };
  }

  /** The weekly grid (Sunday→Saturday) around a reference day. */
  private buildWeek(
    sessions: SessionWithCourse[],
    refMidnight: Date,
    now: ZonedNow,
    semStart: Date,
    semEnd: Date,
  ) {
    const weekStart = addDays(refMidnight, -refMidnight.getUTCDay());
    const todayTime = now.utcMidnight.getTime();

    return Array.from({ length: 7 }, (_, i) => {
      const dayMid = addDays(weekStart, i);
      const weekday = dayMid.getUTCDay();
      const inSemester = dayMid >= semStart && dayMid <= semEnd;
      const daySessions = sessions
        .filter((s) => s.dayOfWeek === weekday)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
        .map((s) => ({
          ...this.view(s),
          classNumber: inSemester ? occurrenceNumber(semStart, dayMid, weekday) : null,
        }));
      return {
        date: formatYmd(dayMid),
        weekday,
        isToday: dayMid.getTime() === todayTime,
        inSemester,
        sessions: daySessions,
      };
    });
  }

  /** The next class the user must attend (today's remaining classes or later). */
  private computeNextClass(
    sessions: SessionWithCourse[],
    now: ZonedNow,
    semStart: Date,
    semEnd: Date,
  ) {
    for (let i = 0; i < 14; i++) {
      const dayMid = addDays(now.utcMidnight, i);
      if (dayMid < semStart || dayMid > semEnd) continue;
      const weekday = dayMid.getUTCDay();
      const daySessions = sessions
        .filter((s) => s.dayOfWeek === weekday)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      for (const s of daySessions) {
        if (i === 0 && timeToMinutes(s.startTime) <= now.minutesOfDay) continue;
        return {
          ...this.view(s),
          date: formatYmd(dayMid),
          classNumber: occurrenceNumber(semStart, dayMid, weekday),
        };
      }
    }
    return null;
  }

  private view(s: SessionWithCourse): SessionView {
    return {
      id: s.id,
      courseId: s.courseId,
      courseName: s.course.name,
      courseCode: s.course.code,
      color: s.course.color,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      label: s.label,
    };
  }
}
