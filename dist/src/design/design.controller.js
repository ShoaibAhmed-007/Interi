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
exports.DesignController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const design_service_1 = require("./design.service");
const create_design_dto_1 = require("./dto/create-design.dto");
const get_user_decorator_1 = require("../auth/decorator/get-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let DesignController = class DesignController {
    designService;
    constructor(designService) {
        this.designService = designService;
    }
    async createDesign(userId, createDesignDto) {
        return this.designService.createDesign(userId, createDesignDto);
    }
};
exports.DesignController = DesignController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new design' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Design created successfully' }),
    (0, swagger_1.ApiBody)({ type: create_design_dto_1.CreateDesignDto }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_design_dto_1.CreateDesignDto]),
    __metadata("design:returntype", Promise)
], DesignController.prototype, "createDesign", null);
exports.DesignController = DesignController = __decorate([
    (0, swagger_1.ApiTags)('designs'),
    (0, common_1.Controller)('designs'),
    __metadata("design:paramtypes", [design_service_1.DesignService])
], DesignController);
//# sourceMappingURL=design.controller.js.map