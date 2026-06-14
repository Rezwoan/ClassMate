export interface User {
  id: string;
  email: string;
  fullName: string;
  instituteName: string;
  studentId: string;
  department: string | null;
  timezone: string;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CourseMini {
  name: string;
  code: string | null;
  color: string;
}

export interface Course {
  id: string;
  semesterId: string;
  name: string;
  code: string | null;
  color: string;
  credits: number | null;
  _count?: {
    classSessions: number;
    quizzes: number;
    homework: number;
    notes: number;
  };
}

export interface ClassSession {
  id: string;
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  label: string | null;
  course?: CourseMini;
}

export interface Teacher {
  id: string;
  courseId: string;
  name: string;
  email: string | null;
  phone: string | null;
  officeRoom: string | null;
  officeHours: string | null;
  course?: CourseMini;
}

export interface NoteImageMeta {
  id: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface Note {
  id: string;
  courseId: string;
  classSessionId: string | null;
  date: string | null;
  title: string;
  content: string;
  updatedAt: string;
  course?: CourseMini;
  images?: NoteImageMeta[];
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  date: string;
  topics: string | null;
  course?: CourseMini;
}

export type HomeworkStatus = "pending" | "submitted" | "late";

export interface Homework {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: HomeworkStatus;
  course?: CourseMini;
}

export interface NotificationPreference {
  pushEnabled: boolean;
  classReminderEnabled: boolean;
  classReminderMinutesBefore: number;
  quizWeekendReminder: boolean;
  quizDayBeforeReminder: boolean;
  homeworkReminderEnabled: boolean;
  homeworkReminderDaysBefore: number;
  emailForClasses: boolean;
  emailForQuizzes: boolean;
  emailForHomework: boolean;
  emailForGeneral: boolean;
}

export interface AgendaSessionView {
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
  classNumber: number | null;
  date?: string;
}

export interface AgendaDay {
  date: string;
  weekday: number;
  isToday: boolean;
  inSemester: boolean;
  sessions: AgendaSessionView[];
}

export interface AgendaResponse {
  semester: Semester | null;
  today: string;
  week: AgendaDay[];
  nextClass: AgendaSessionView | null;
  upcomingQuizzes: Quiz[];
  dueHomework: Homework[];
}

// ---------- Admin ----------

export interface AdminStats {
  users: { total: number; verified: number; admins: number; newLast7Days: number };
  content: {
    semesters: number;
    courses: number;
    classSessions: number;
    teachers: number;
    notes: number;
    noteImages: number;
    quizzes: number;
    homework: number;
  };
  storage: { imageBytes: number };
  push: { subscriptions: number };
  recentUsers: Array<{
    id: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
    isAdmin: boolean;
    createdAt: string;
  }>;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  instituteName: string;
  studentId: string;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  _count: { courses: number; notes: number; quizzes: number; homework: number };
}

export interface AdminUserList {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  fullName: string;
  instituteName: string;
  studentId: string;
  department: string | null;
  timezone: string;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    semesters: number;
    courses: number;
    classSessions: number;
    teachers: number;
    notes: number;
    quizzes: number;
    homework: number;
    pushSubscriptions: number;
  };
  semesters: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    _count: { courses: number };
  }>;
  courses: Array<{ id: string; name: string; code: string | null; color: string }>;
}
