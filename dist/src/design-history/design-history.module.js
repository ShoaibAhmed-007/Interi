"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignHistoryModule = void 0;
const common_1 = require("@nestjs/common");
const design_history_controller_1 = require("./design-history.controller");
const design_history_service_1 = require("./design-history.service");
const prisma_module_1 = require("../prisma/prisma.module");
const amazon_s3_module_1 = require("../amazon-s3/amazon-s3.module");
let DesignHistoryModule = class DesignHistoryModule {
};
exports.DesignHistoryModule = DesignHistoryModule;
exports.DesignHistoryModule = DesignHistoryModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, amazon_s3_module_1.AmazonS3Module],
        controllers: [design_history_controller_1.DesignHistoryController],
        providers: [design_history_service_1.DesignHistoryService],
        exports: [design_history_service_1.DesignHistoryService],
    })
], DesignHistoryModule);
//# sourceMappingURL=design-history.module.js.map