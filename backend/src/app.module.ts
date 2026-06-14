import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassSessionsModule } from './modules/class-sessions/class-sessions.module';
import { CoursesModule } from './modules/courses/courses.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { MailModule } from './modules/mail/mail.module';
import { NotesModule } from './modules/notes/notes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { SemestersModule } from './modules/semesters/semesters.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    SemestersModule,
    CoursesModule,
    ClassSessionsModule,
    TeachersModule,
    NotesModule,
    QuizzesModule,
    HomeworkModule,
    AgendaModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    // Every route requires a valid access token unless marked @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
