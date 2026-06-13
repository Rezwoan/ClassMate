import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushSubscription } from '@prisma/client';
import * as webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger('WebPushService');
  private configured = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT', 'mailto:admin@classmate.app');
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.configured = true;
    } else {
      this.logger.warn('VAPID keys not configured — web push disabled.');
    }
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  /** Sends a payload to every subscription a user has. Prunes dead ones. */
  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!this.configured) return 0;
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    let delivered = 0;
    await Promise.all(subs.map(async (sub) => {
      const ok = await this.sendToSubscription(sub, payload);
      if (ok) delivered += 1;
    }));
    return delivered;
  }

  private async sendToSubscription(
    sub: PushSubscription,
    payload: PushPayload,
  ): Promise<boolean> {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      return true;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 404/410 mean the subscription is gone — remove it.
      if (statusCode === 404 || statusCode === 410) {
        await this.prisma.pushSubscription
          .delete({ where: { id: sub.id } })
          .catch(() => undefined);
        this.logger.log(`Pruned expired push subscription ${sub.id}`);
      } else {
        this.logger.warn(`Push send failed (${statusCode ?? 'unknown'}) for ${sub.id}`);
      }
      return false;
    }
  }
}
