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
exports.CreateDesignDto = exports.DesignCategory = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var DesignCategory;
(function (DesignCategory) {
    DesignCategory["INTERIOR"] = "INTERIOR";
    DesignCategory["EXTERIOR"] = "EXTERIOR";
    DesignCategory["LANDSCAPE"] = "LANDSCAPE";
    DesignCategory["NEW_FLOORING"] = "NEW_FLOORING";
    DesignCategory["FURNITURE_DESIGN"] = "FURNITURE_DESIGN";
})(DesignCategory || (exports.DesignCategory = DesignCategory = {}));
class CreateDesignDto {
    category;
    originalImageUrl;
    location;
    style;
    colorPalette;
    seedUsed;
}
exports.CreateDesignDto = CreateDesignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: DesignCategory, example: DesignCategory.INTERIOR }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(DesignCategory, {
        message: 'category must be one of: INTERIOR, EXTERIOR, LANDSCAPE, NEW_FLOORING, or FURNITURE_DESIGN',
    }),
    __metadata("design:type", String)
], CreateDesignDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://example.com/original.jpg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDesignDto.prototype, "originalImageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'living room' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ example: 'Living Room' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDesignDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Modern' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDesignDto.prototype, "style", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'High-Contrast' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDesignDto.prototype, "colorPalette", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: 'number',
        example: null,
        description: 'Optional numeric seed used by the AI',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value !== null && value !== undefined ? BigInt(value) : null),
    __metadata("design:type", BigInt)
], CreateDesignDto.prototype, "seedUsed", void 0);
//# sourceMappingURL=create-design.dto.js.map