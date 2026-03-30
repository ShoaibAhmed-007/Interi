"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenuecatModule = void 0;
const common_1 = require("@nestjs/common");
const revenuecat_controller_1 = require("./revenuecat.controller");
const revenuecat_service_1 = require("./revenuecat.service");
const revenuecat_guard_1 = require("./revenuecat.guard");
let RevenuecatModule = class RevenuecatModule {
};
exports.RevenuecatModule = RevenuecatModule;
exports.RevenuecatModule = RevenuecatModule = __decorate([
    (0, common_1.Module)({
        controllers: [revenuecat_controller_1.RevenueCatController],
        providers: [revenuecat_service_1.RevenueCatService, revenuecat_guard_1.RevenueCatGuard],
        exports: [revenuecat_service_1.RevenueCatService],
    })
], RevenuecatModule);
//# sourceMappingURL=revenuecat.module.js.map