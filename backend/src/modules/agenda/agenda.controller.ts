import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AgendaService } from './agenda.service';

@Controller('agenda')
export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  /** Home-screen summary: week grid, next class, upcoming quizzes & homework. */
  @Get()
  home(
    @CurrentUser('userId') userId: string,
    @Query('date') date?: string,
  ) {
    return this.agenda.home(userId, date);
  }
}
