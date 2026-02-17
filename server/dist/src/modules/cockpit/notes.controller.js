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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cockpit_service_1 = require("./cockpit.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const current_user_decorator_1 = require("../../platform/http/decorators/current-user.decorator");
const create_note_dto_1 = require("./dto/create-note.dto");
const update_note_dto_1 = require("./dto/update-note.dto");
let NotesController = class NotesController {
    constructor(cockpitService) {
        this.cockpitService = cockpitService;
    }
    async create(userId, dto) {
        return this.cockpitService.createNote(userId, dto);
    }
    async findAll(userId) {
        return this.cockpitService.findAllNotes(userId);
    }
    async findOne(userId, noteId) {
        return this.cockpitService.findOneNote(userId, noteId);
    }
    async update(userId, noteId, dto) {
        return this.cockpitService.updateNote(userId, noteId, dto);
    }
    async delete(userId, noteId) {
        return this.cockpitService.deleteNote(userId, noteId);
    }
};
exports.NotesController = NotesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new note' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Note created' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_note_dto_1.CreateNoteDto]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all notes for user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of notes' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get note details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Note details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update note' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated note' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_note_dto_1.UpdateNoteDto]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a note' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Note deleted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "delete", null);
exports.NotesController = NotesController = __decorate([
    (0, swagger_1.ApiTags)('Cockpit Notes'),
    (0, common_1.Controller)('cockpit/notes'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [cockpit_service_1.CockpitService])
], NotesController);
//# sourceMappingURL=notes.controller.js.map