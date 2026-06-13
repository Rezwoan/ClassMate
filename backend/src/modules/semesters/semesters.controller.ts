import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';
import { SemestersService } from './semesters.service';

@Controller('semesters')
export class SemestersController {
  constructor(private readonly semesters: SemestersService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateSemesterDto) {
    return this.semesters.create(userId, dto);
  }

  @Get()
  list(@CurrentUser('userId') userId: string) {
    return this.semesters.list(userId);
  }

  @Get('active')
  active(@CurrentUser('userId') userId: string) {
    return this.semesters.active(userId);
  }

  @Get(':id')
  get(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.semesters.get(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSemesterDto,
  ) {
    return this.semesters.update(userId, id, dto);
  }

  @Post(':id/activate')
  activate(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.semesters.activate(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.semesters.remove(userId, id);
  }
}
