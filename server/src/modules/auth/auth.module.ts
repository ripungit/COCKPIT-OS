import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasskeysService } from './passkeys/passkeys.service';
import { WebauthnService } from './passkeys/webauthn.service';
import { HttpModule } from '../../platform/http/http.module';
import { SecurityModule } from '../../platform/security/security.module';

@Module({
    imports: [HttpModule, SecurityModule],
    controllers: [AuthController],
    providers: [AuthService, PasskeysService, WebauthnService],
    exports: [AuthService],
})
export class AuthModule { }
