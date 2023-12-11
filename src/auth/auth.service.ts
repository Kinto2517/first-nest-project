import { ForbiddenException, Injectable } from "@nestjs/common";
import { User, Bookmark } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as argon from 'argon2';
import { AuthDto } from "./dto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
        ){}
    

    async signin(dto: AuthDto){
        
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });

        if(!user){
            throw new ForbiddenException('Email not found');
        }

        const isPasswordValid = await argon.verify(user.hash, dto.password);

        if(!isPasswordValid){
            throw new ForbiddenException('Password is wrong');
        }

        return this.signToken(user.id, user.email);
    }


    async signup(dto: AuthDto){

        const hash = await argon.hash(dto.password)

        try {
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash: hash
            }
        });

        return this.signToken(user.id, user.email);
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ForbiddenException('Email already exists');
        }
        throw error;
    }
    }

    async signToken(userId: number, email: string): Promise<{access_token: string}>{
       const payload = {
              sub: userId,
              email: email
         }
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: this.config.get('JWT_SECRET')
        });

        return {
            access_token: token,
        }
    }
}