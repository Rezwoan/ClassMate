import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { otpTemplate, reminderTemplate } from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>(
      'MAIL_FROM',
      'ClassMate <onboarding@resend.dev>',
    );
    this.resend = key && key !== 're_your_key_here' ? new Resend(key) : null;
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY not configured — emails will be logged, not sent.');
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[email suppressed] to=${to} subject="${subject}"`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Resend rejected email to ${to}: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${to}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async sendOtp(
    to: string,
    name: string,
    code: string,
    purposeLabel = 'verify your email',
  ): Promise<void> {
    await this.send(
      to,
      `Your ClassMate code: ${code}`,
      otpTemplate(name, code, purposeLabel),
    );
  }

  async sendReminder(to: string, subject: string, heading: string, body: string): Promise<void> {
    await this.send(to, subject, reminderTemplate(heading, body));
  }
}
