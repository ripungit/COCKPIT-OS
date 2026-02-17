"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = class MailService {
    constructor(configService) {
        this.configService = configService;
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT', 465),
            secure: this.configService.get('SMTP_SECURE', true),
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('❌ SMTP Connection Error:', error);
            }
            else {
                console.log('✅ SMTP Server is ready to take our messages');
            }
        });
    }
    async sendMail(to, subject, html) {
        const from = this.configService.get('FROM_EMAIL');
        await this.transporter.sendMail({
            from: `"CockpitOS" <${from}>`,
            to,
            subject,
            html,
        });
    }
    async sendOtpEmail(to, otp) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map