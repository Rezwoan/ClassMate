import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Note, NoteImage, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toUtcMidnight } from '../../common/utils/schedule.util';
import { CoursesService } from '../courses/courses.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

/** A file as produced by multer's memory storage (we avoid a global types dep). */
export interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

/** Image columns safe to return inline — never ships the raw bytes. */
const IMAGE_META_SELECT = {
  id: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  createdAt: true,
} satisfies Prisma.NoteImageSelect;

const WITH_RELATIONS = {
  course: { select: { name: true, code: true, color: true } },
  images: { select: IMAGE_META_SELECT, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.NoteInclude;

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesService,
  ) {}

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    await this.courses.requireOwned(userId, dto.courseId);
    if (dto.classSessionId) {
      await this.requireSession(userId, dto.classSessionId, dto.courseId);
    }
    return this.prisma.note.create({
      data: {
        userId,
        courseId: dto.courseId,
        classSessionId: dto.classSessionId ?? null,
        date: dto.date ? toUtcMidnight(new Date(dto.date)) : null,
        title: dto.title ?? '',
        content: dto.content ?? '',
      },
      include: WITH_RELATIONS,
    });
  }

  list(
    userId: string,
    courseId?: string,
    classSessionId?: string,
    date?: string,
  ): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: {
        userId,
        ...(courseId ? { courseId } : {}),
        ...(classSessionId ? { classSessionId } : {}),
        ...(date ? { date: toUtcMidnight(new Date(date)) } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: WITH_RELATIONS,
    });
  }

  get(userId: string, id: string) {
    return this.requireOwned(userId, id, true);
  }

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.requireOwned(userId, id);
    if (dto.classSessionId) {
      await this.requireSession(userId, dto.classSessionId, note.courseId);
    }
    return this.prisma.note.update({
      where: { id },
      data: {
        classSessionId:
          dto.classSessionId === undefined ? undefined : dto.classSessionId,
        date:
          dto.date === undefined
            ? undefined
            : dto.date
              ? toUtcMidnight(new Date(dto.date))
              : null,
        title: dto.title,
        content: dto.content,
      },
      include: WITH_RELATIONS,
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.note.delete({ where: { id } });
    return { message: 'Note deleted.' };
  }

  // ---------- images ----------

  async addImages(userId: string, noteId: string, files: MulterFile[]) {
    await this.requireOwned(userId, noteId);
    if (!files?.length) throw new BadRequestException('No images uploaded.');
    for (const f of files) {
      if (!ALLOWED_IMAGE_TYPES.has(f.mimetype)) {
        throw new BadRequestException(`Unsupported image type: ${f.mimetype}`);
      }
    }
    await this.prisma.noteImage.createMany({
      data: files.map((f) => ({
        userId,
        noteId,
        data: new Uint8Array(f.buffer),
        mimeType: f.mimetype,
        sizeBytes: f.size,
      })),
    });
    return this.requireOwned(userId, noteId, true);
  }

  /** Returns the image row including its raw bytes (for streaming). */
  async getImage(userId: string, imageId: string): Promise<NoteImage> {
    const image = await this.prisma.noteImage.findFirst({
      where: { id: imageId, userId },
    });
    if (!image) throw new NotFoundException('Image not found.');
    return image;
  }

  async removeImage(userId: string, imageId: string) {
    const image = await this.prisma.noteImage.findFirst({
      where: { id: imageId, userId },
      select: { id: true },
    });
    if (!image) throw new NotFoundException('Image not found.');
    await this.prisma.noteImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted.' };
  }

  // ---------- helpers ----------

  private async requireOwned(
    userId: string,
    id: string,
    withRelations = false,
  ): Promise<Note> {
    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      ...(withRelations ? { include: WITH_RELATIONS } : {}),
    });
    if (!note) throw new NotFoundException('Note not found.');
    return note;
  }

  private async requireSession(
    userId: string,
    sessionId: string,
    courseId: string,
  ) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, userId, courseId },
      select: { id: true },
    });
    if (!session) {
      throw new NotFoundException('Class session not found for this course.');
    }
  }
}
