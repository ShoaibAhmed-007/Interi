"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicTestingUploadModule = void 0;
const common_1 = require("@nestjs/common");
const amazon_s3_module_1 = require("../amazon-s3/amazon-s3.module");
const public_testing_upload_controller_1 = require("./public-testing-upload.controller");
const public_testing_upload_service_1 = require("./public-testing-upload.service");
let PublicTestingUploadModule = class PublicTestingUploadModule {
};
exports.PublicTestingUploadModule = PublicTestingUploadModule;
exports.PublicTestingUploadModule = PublicTestingUploadModule = __decorate([
    (0, common_1.Module)({
        imports: [amazon_s3_module_1.AmazonS3Module],
        controllers: [public_testing_upload_controller_1.PublicTestingUploadController],
        providers: [public_testing_upload_service_1.PublicTestingUploadService],
    })
], PublicTestingUploadModule);
//# sourceMappingURL=public-testing-upload.module.js.map