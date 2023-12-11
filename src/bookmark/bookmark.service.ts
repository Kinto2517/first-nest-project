import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {

    constructor(private prisma: PrismaService) { }

    getBookmarks(
        userId: number
    ) {
        return this.prisma.bookmark.findMany({
            where: {
                userId
            }
        });
    }

    getBookmarkById(
        userId: number,
        bookmarkId: number
    ) {
        return this.prisma.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId
            }
        });

    }

    async createBookmark(
        userId: number,
        dto: CreateBookmarkDto
    ) {
        const bookmark = await this.prisma.bookmark.create({
            data: {
                userId,
                ...dto,
            }
        });
        return bookmark;

    }

    async updateBookmark(
        userId: number,
        bookmarkId: number,
        dto: EditBookmarkDto
    ) {
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId,
            }
        });
        if (!bookmark || bookmark.userId !== userId) {
            throw new NotFoundException();
        }
        return this.prisma.bookmark.update({
            where: {
                id: bookmarkId,
            },
            data: {
                ...dto,
            }
        });
        
    }

    async deleteBookmark(
        userId: number,
        bookmarkId: number
    ) {
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId,
            }
        });
        if (!bookmark || bookmark.userId !== userId) {
            throw new NotFoundException();
        }
        return this.prisma.bookmark.delete({
            where: {
                id: bookmarkId,
            }
        });
    }
}
