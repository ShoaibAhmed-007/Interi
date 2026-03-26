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
        profilePicture: string | null;
        createdAt: Date;
        freeTrialsLeft: number;
        subscribed: boolean;
        id: string;
        googleId: string | null;
        appleId: string | null;
        updatedAt: Date;
    }>;
}
export {};
