"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocktailAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const cocktail_service_1 = require("./cocktail.service");
let CocktailAuthGuard = class CocktailAuthGuard {
    constructor(cocktailService) {
        this.cocktailService = cocktailService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const headers = request.headers;
        const deviceId = headers['x-device-id'];
        const signature = headers['x-signature'];
        const ts = headers['x-ts'];
        const nonce = headers['x-nonce'];
        if (!deviceId || !signature || !ts || !nonce) {
            throw new common_1.UnauthorizedException('Missing authentication headers');
        }
        let bodyStr = '';
        if (request.body && Object.keys(request.body).length > 0) {
            bodyStr = JSON.stringify(request.body);
        }
        else {
            bodyStr = '{}';
        }
        const isValid = await this.cocktailService.verifyDeviceAuth(deviceId, signature, ts, nonce, bodyStr);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid signature');
        }
        request.device = { id: deviceId };
        return true;
    }
};
exports.CocktailAuthGuard = CocktailAuthGuard;
exports.CocktailAuthGuard = CocktailAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cocktail_service_1.CocktailService])
], CocktailAuthGuard);
//# sourceMappingURL=cocktail.auth.js.map