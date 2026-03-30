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
exports.ApplyStyleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ApplyStyleDto {
    sourceKey;
    targetKey;
    location;
}
exports.ApplyStyleDto = ApplyStyleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'S3 key of the image to take color palette and style from' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ApplyStyleDto.prototype, "sourceKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'S3 key of the image to apply the style to (keep composition)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ApplyStyleDto.prototype, "targetKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Optional description of the target location (e.g., Living Room)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ApplyStyleDto.prototype, "location", void 0);
//# sourceMappingURL=apply-style.dto.js.map