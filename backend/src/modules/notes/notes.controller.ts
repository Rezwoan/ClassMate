import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { MulterFile, NotesService } from './notes.service';

// Client compresses before upload; this is a generous safety ceiling.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES_PER_REQUEST = 10;

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateNoteDto) {
    return this.notes.create(userId, dto);
  }

  @Get()
  list(
    @CurrentUser('userId') userId: string,
    @Query('courseId') courseId?: string,
    @Query('classSessionId') classSessionId?: string,
    @Query('date') date?: string,
  ) {
    return this.notes.list(userId, courseId, classSessionId, date);
  }

  // Defined before ":id" so "images" is never treated as a note id.
  @Get('images/:imageId')
  @Header('Cache-Control', 'private, max-age=31536000, immutable')
  async getImage(
    @CurrentUser('userId') userId: string,
    @Param('imageId') imageId: string,
  ): Promise<StreamableFile> {
    const image = await this.notes.getImage(userId, imageId);
    return new StreamableFile(Buffer.from(image.data), {
      type: image.mimeType,
    });
  }

  @Delete('images/:imageId')
  removeImage(
    @CurrentUser('userId') userId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.notes.removeImage(userId, imageId);
  }

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', MAX_IMAGES_PER_REQUEST, {
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  addImages(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @UploadedFiles() files: MulterFile[],
  ) {
    return this.notes.addImages(userId, id, files);
  }

  @Get(':id')
  get(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notes.get(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notes.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notes.remove(userId, id);
  }
}
