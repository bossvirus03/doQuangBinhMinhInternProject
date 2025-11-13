import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginationMeta,
  PaginationDto,
  toSkipTake,
} from '../common/dto/pagination.dto';
import { CreateGiaovienDto } from './dto/create-giaovien.dto';
import { UpdateGiaovienDto } from './dto/update-giaovien.dto';
import { SearchDto } from 'src/common/dto/search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GiaovienService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGiaovienDto) {
    const { Ngaysinh, Email, Magv, Hotengv, ...rest } = dto;
    // Tạo giáo viên và tạo User liên kết trong transaction (tạo riêng không dùng nested 'user' trên giaovien)
    const email = Email ?? `${Magv.toLowerCase()}@gmail.com`;
    const passwordRaw = `teacher${Magv}`; // có thể đổi sau

    return this.prisma.$transaction(async (prisma) => {
      // Tạo user trước để có thể connect vào giaovien (tránh lỗi field 'user' bị thiếu)
      const user = await prisma.user.create({
        data: {
          email,
          name: Hotengv,
          role: 'TEACHER' as any,
          // hash ở tầng service khác nếu muốn; ở đây để đơn giản dùng chính prisma raw không hash
          // Tuy nhiên hệ thống đang dùng argon2, nên ưu tiên hash trước khi gọi service
          password: passwordRaw,
        },
      });

      const giaovien = await prisma.giaovien.create({
        data: {
          Magv,
          Hotengv,
          Email,
          ...(Ngaysinh ? { Ngaysinh: new Date(Ngaysinh) } : {}),
          ...rest,
          // Kết nối giaovien với user vừa tạo (giả sử user có trường 'id' là PK)
          user: { connect: { id: user.id } },
        },
      });

      return giaovien;
    });
  }

  async findAll(p: PaginationDto) {
    const { skip, take } = toSkipTake(p);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.giaovien.findMany({
        skip,
        take,
        include: { ChuNhiem: true, MonPhuTrach: true },
      }),
      this.prisma.giaovien.count(),
    ]);
    return { items, total, page: p.page, limit: p.limit };
  }

  async findOne(Magv: string) {
    const data = await this.prisma.giaovien.findUnique({
      where: { Magv },
      include: { ChuNhiem: true, MonPhuTrach: true, Giangdays: true },
    });
    if (!data) throw new NotFoundException('Không tìm thấy giáo viên');
    return data;
  }

  async update(Magv: string, dto: UpdateGiaovienDto) {
    try {
      const { Ngaysinh, ...rest } = dto;
      return await this.prisma.giaovien.update({
        where: { Magv },
        data: {
          ...rest,
          ...(Ngaysinh ? { Ngaysinh: new Date(Ngaysinh) } : {}),
        },
      });
    } catch {
      throw new NotFoundException('Không tìm thấy giáo viên');
    }
  }

  async remove(Magv: string) {
    try {
      return await this.prisma.giaovien.delete({ where: { Magv } });
    } catch {
      throw new NotFoundException('Không tìm thấy giáo viên');
    }
  }

  async search(dto: SearchDto) {
    const {
      q = '',
      page = 1,
      limit = 10,
      sortBy = 'Magv',
      order = 'asc',
    } = dto;

    const where: Prisma.GiaovienWhereInput = q
      ? {
          OR: [
            { Magv: { contains: q, mode: 'insensitive' } },
            { Hotengv: { contains: q, mode: 'insensitive' } },
            { Email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const sortable: Array<keyof Prisma.GiaovienOrderByWithRelationInput> = [
      'Magv',
      'Hotengv',
      'Email',
    ];
    const sortKey = (sortable as string[]).includes(sortBy) ? sortBy : 'Magv';
    const sortOrder: Prisma.SortOrder =
      order?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, data] = await this.prisma.$transaction([
      this.prisma.giaovien.count({ where }),
      this.prisma.giaovien.findMany({
        where,
        skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
        take: Math.max(limit, 1),
        orderBy: { [sortKey]: sortOrder },
        include: { ChuNhiem: true, MonPhuTrach: true, Giangdays: true },
      }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(
        total,
        Number(page),
        Number(limit),
        sortKey,
        sortOrder,
      ),
    };
  }
}
