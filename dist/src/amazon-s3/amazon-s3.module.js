"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonS3Module = void 0;
const common_1 = require("@nestjs/common");
const amazon_s3_controller_1 = require("./amazon-s3.controller");
const amazon_s3_service_1 = require("./amazon-s3.service");
let AmazonS3Module = class AmazonS3Module {
};
exports.AmazonS3Module = AmazonS3Module;
exports.AmazonS3Module = AmazonS3Module = __decorate([
    (0, common_1.Module)({
        controllers: [amazon_s3_controller_1.AmazonS3Controller],
        providers: [amazon_s3_service_1.AmazonS3Service],
        exports: [amazon_s3_service_1.AmazonS3Service],
    })
], AmazonS3Module);
//# sourceMappingURL=amazon-s3.module.js.map