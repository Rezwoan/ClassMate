# Data Model

The authoritative schema is [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).
This document is the narrative version — **keep them in sync**.

> SQLite note: Prisma does not support native enums on SQLite, so "enum-like"
> fields are stored as `String` with the allowed values documented here and
> validated in DTOs.

## Entity relationships

```
User 1───* Semester 1───* Course 1───* ClassSession
  │                          │  1───* Teacher
  │                          │  1───* Quiz
  │                          │  1───* Homework
  │                          └──1───* Note  *───0..1 ClassSession
  │                                     └──1───* NoteImage
  ├──1───1 NotificationPreference
  ├──1───* PushSubscription
  ├──1───* OtpToken
  ├──1───* RefreshToken
  └──1───* NotificationLog
```

## Entities

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| email | String | unique |
| passwordHash | String | bcrypt |
| fullName | String | |
| instituteName | String | university/college |
| studentId | String | institutional ID |
| department | String? | optional |
| emailVerified | Boolean | set true after OTP |
| isAdmin | Boolean | grants admin-panel access (default false) |
| timezone | String | IANA tz, default `UTC` |
| createdAt / updatedAt | DateTime | |

### Semester
| Field | Type | Notes |
|-------|------|-------|
| id, userId | String | userId → User |
| name | String | e.g. "Spring 2026" |
| startDate, endDate | DateTime | |
| isActive | Boolean | one active semester at a time |

### Course
| Field | Type | Notes |
|-------|------|-------|
| id, userId, semesterId | String | |
| name | String | |
| code | String? | e.g. "CSE-220" |
| color | String | hex, for calendar chips |
| credits | Float? | optional |

### ClassSession  (recurring weekly slot)
| Field | Type | Notes |
|-------|------|-------|
| id, userId, courseId | String | |
| dayOfWeek | Int | 0=Sun … 6=Sat |
| startTime, endTime | String | `"HH:mm"` local |
| room | String? | location |
| label | String? | e.g. "Lab", "Lecture" |

The **class number** used in reminders ("Class 7 of CSE-220") is *computed* as the
Nth occurrence of that session since the semester start date.

### Teacher
| Field | Type | Notes |
|-------|------|-------|
| id, userId, courseId | String | attached to a course |
| name | String | |
| email | String? | |
| phone | String? | |
| officeRoom | String? | |
| officeHours | String? | |

### Quiz
| Field | Type | Notes |
|-------|------|-------|
| id, userId, courseId | String | |
| title | String | |
| date | DateTime | when the quiz happens |
| topics | String? | syllabus / topics (markdown) |
| reminded* | Boolean | dedupe flags for cron |

### Homework  (assignment)
| Field | Type | Notes |
|-------|------|-------|
| id, userId, courseId | String | |
| title | String | |
| description | String? | markdown |
| dueDate | DateTime | submission deadline |
| status | String | `pending` \| `submitted` \| `late` |

### Note
| Field | Type | Notes |
|-------|------|-------|
| id, userId, courseId | String | |
| classSessionId | String? | optional link to a specific class slot |
| date | DateTime? | the specific class-occurrence day (UTC midnight) this note is for; set when added from the home screen for one day's class, null for general course notes |
| title | String | optional (default `""`) so image-only notes are allowed |
| content | String | markdown |

A note can be text, images, or both. Filtering by `classSessionId` + `date`
returns the notes for one calendar day's class (used by the home-screen class
sheet). `@@index([classSessionId, date])` backs that lookup.

### NoteImage  (photo attached to a note)
| Field | Type | Notes |
|-------|------|-------|
| id, userId, noteId | String | noteId → Note (cascade delete) |
| data | Bytes | the image bytes, stored inline in SQLite |
| mimeType | String | e.g. `image/jpeg` |
| sizeBytes | Int | compressed size |
| width, height | Int? | optional dimensions |

Images live **in the database** (not on disk) so the single-file backup
(`cp classmate.db`) includes them. Clients downscale/recompress photos before
upload to keep the DB lean. Bytes are served only through the authenticated
`GET /notes/images/:imageId` endpoint (ownership-scoped); list/detail responses
return image **metadata only**, never the raw bytes.

### NotificationPreference  (1 per user)
| Field | Type | Default |
|-------|------|---------|
| pushEnabled | Boolean | false |
| classReminderEnabled | Boolean | true |
| classReminderMinutesBefore | Int | 30 |
| quizWeekendReminder | Boolean | true |
| quizDayBeforeReminder | Boolean | true |
| homeworkReminderEnabled | Boolean | true |
| homeworkReminderDaysBefore | Int | 1 |
| emailForClasses | Boolean | false |
| emailForQuizzes | Boolean | true |
| emailForHomework | Boolean | true |
| emailForGeneral | Boolean | false |

Per-category email toggles exist so the user only spends Resend email quota on the
categories they care about (default: quizzes + homework).

### PushSubscription
| Field | Type | Notes |
|-------|------|-------|
| id, userId | String | |
| endpoint | String | unique |
| p256dh, auth | String | web-push keys |
| userAgent | String? | |

### OtpToken
| Field | Type | Notes |
|-------|------|-------|
| id, userId | String | |
| codeHash | String | hashed 6-digit code |
| purpose | String | `EMAIL_VERIFY` \| `LOGIN` \| `PASSWORD_RESET` |
| expiresAt | DateTime | ~10 min |
| consumedAt | DateTime? | |
| attempts | Int | brute-force guard |

### RefreshToken
| Field | Type | Notes |
|-------|------|-------|
| id, userId | String | |
| tokenHash | String | |
| expiresAt | DateTime | |
| revokedAt | DateTime? | rotation/revocation |

### NotificationLog  (dedupe + audit)
| Field | Type | Notes |
|-------|------|-------|
| id, userId | String | |
| type | String | `CLASS` \| `QUIZ_WEEKEND` \| `QUIZ_DAY_BEFORE` \| `HOMEWORK` |
| refKey | String | e.g. `quiz:<id>` or `class:<id>:<date>` |
| channel | String | `PUSH` \| `EMAIL` |
| sentAt | DateTime | |

`(userId, type, refKey, channel)` is unique to guarantee one send.
