
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT', 465),
            secure: this.configService.get<boolean>('SMTP_SECURE', true),
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });

        this.transporter.verify((error, success) => {
            if (error) {
                console.error('❌ SMTP Connection Error:', error);
            } else {
                console.log('✅ SMTP Server is ready to take our messages');
            }
        });
    }

    async sendMail(to: string, subject: string, html: string) {
        const from = this.configService.get<string>('FROM_EMAIL');
        await this.transporter.sendMail({
            from: `"CockpitOS" <${from}>`,
            to,
            subject,
            html,
        });
    }

    async sendOtpEmail(to: string, otp: string) {
        const subject = 'Verify your email for CockpitOS';
        const html = `
<div style="margin:0; padding:0; background-color:#ffffff;">
  <div style="max-width:520px; margin:40px auto; padding:0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#1a1a1a;">
    
    <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:28px;">
      
      <h2 style="margin:0 0 12px 0; font-size:18px; font-weight:600;">
        Verify your email
      </h2>

      <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5563;">
        Use the verification code below to complete your sign in to <strong>CockpitOS</strong>.
      </p>

      <div style="
        margin:18px 0;
        padding:14px 16px;
        border:1px solid #e5e7eb;
        border-radius:10px;
        background:#ffffff;
        display:inline-block;
      ">
        <span style="
          font-size:22px;
          font-weight:600;
          letter-spacing:6px;
          color:#111827;
        ">
          ${otp}
        </span>
      </div>

      <p style="margin:18px 0 6px 0; font-size:12px; color:#6b7280;">
        This code expires in 10 minutes.
      </p>

      <p style="margin:0; font-size:12px; color:#9ca3af;">
        If you didn't request this email, you can safely ignore it.
      </p>

    </div>

    <p style="margin:16px 4px 0 4px; font-size:11px; color:#9ca3af;">
      © ${new Date().getFullYear()} CockpitOS. By Ripun Basumatary. All rights reserved.
    </p>

  </div>
</div>
`;

        await this.sendMail(to, subject, html);
    }
}
