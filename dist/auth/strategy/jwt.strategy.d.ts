import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: string;
        email: string;
        name: string;
    }): Promise<{
        name: string | null;
        email: string;
        id: string;
        googleId: string | null;
        appleId: string | null;
        freeTrialsLeft: number;
        subscribed: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
