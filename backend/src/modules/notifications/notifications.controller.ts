import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  SubscribeDto,
  UnsubscribeDto,
  UpdatePreferenceDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('preferences')
  getPreferences(@CurrentUser('userId') userId: string) {
    return this.notifications.getPreferences(userId);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.notifications.updatePreferences(userId, dto);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(@CurrentUser('userId') userId: string, @Body() dto: SubscribeDto) {
    return this.notifications.subscribe(userId, dto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  unsubscribe(@CurrentUser('userId') userId: string, @Body() dto: UnsubscribeDto) {
    return this.notifications.unsubscribe(userId, dto.endpoint);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  test(@CurrentUser('userId') userId: string) {
    return this.notifications.sendTest(userId);
  }
}
