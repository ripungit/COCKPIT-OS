import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(private readonly configService: ConfigService) { }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const region = this.configService.get<string>('ZOHO_REGION', 'in');
    const clientId = this.configService.get<string>('ZOHO_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ZOHO_CLIENT_SECRET');
    const refreshToken = this.configService.get<string>('ZOHO_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Zoho Mail API credentials are not fully configured.');
    }

    const tokenUrl = `https://accounts.zoho.${region}/oauth/v2/token`;

    try {
      const params = new URLSearchParams();
      params.append('refresh_token', refreshToken);
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('grant_type', 'refresh_token');

      const response = await axios.post(tokenUrl, params);

      if (response.data.error) {
        throw new Error(`Zoho Token Error: ${JSON.stringify(response.data)}`);
      }

      this.accessToken = response.data.access_token;

      if (!this.accessToken) {
        throw new Error('No access token received from Zoho');
      }

      // Token usually expires in 3600 seconds (1 hour). Set expiry to 55 minutes to be safe.
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to refresh Zoho access token', error);
      throw error;
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = this.configService.get<string>('FROM_EMAIL');
    const accountId = this.configService.get<string>('ZOHO_ACCOUNT_ID');
    const region = this.configService.get<string>('ZOHO_REGION', 'in');

    if (!accountId) {
      throw new Error('ZOHO_ACCOUNT_ID is not configured.');
    }

    try {
      const token = await this.getAccessToken();
      const mailUrl = `https://mail.zoho.${region}/api/accounts/${accountId}/messages`;

      const body = {
        fromAddress: from,
        toAddress: to,
        subject: subject,
        content: html,
        // askReceipt: "yes" // Optional
      };

      await axios.post(mailUrl, body, {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`📧 Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}`, error.response?.data || error.message);
      throw error;
    }
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
