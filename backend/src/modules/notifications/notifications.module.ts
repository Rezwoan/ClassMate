import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';
import { WebPushService } from './web-push.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WebPushService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
