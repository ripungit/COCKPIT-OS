import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly configService;
    private readonly logger;
    private accessToken;
    private tokenExpiry;
    constructor(configService: ConfigService);
    private getAccessToken;
    sendMail(to: string, subject: string, html: string): Promise<void>;
    sendOtpEmail(to: string, otp: string): Promise<void>;
}
