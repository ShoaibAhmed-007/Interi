import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
declare const JwtRefreshStrategy_base: any;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    constructor(config: ConfigService);
    validate(req: Request, payload: {
        sub: number;
        email: string;
        name: string;
    }): {
        refreshToken: any;
        sub: number;
        email: string;
        name: string;
    };
}
export {};
