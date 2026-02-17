"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVpsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_vps_dto_1 = require("./create-vps.dto");
class UpdateVpsDto extends (0, swagger_1.PartialType)(create_vps_dto_1.CreateVpsDto) {
}
exports.UpdateVpsDto = UpdateVpsDto;
//# sourceMappingURL=update-vps.dto.js.map