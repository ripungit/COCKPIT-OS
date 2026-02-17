import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly configService;
    private transporter;
    constructor(configService: ConfigService);
    sendMail(to: string, subject: string, html: string): Promise<void>;
    sendOtpEmail(to: string, otp: string): Promise<void>;
}
