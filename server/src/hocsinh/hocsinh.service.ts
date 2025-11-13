import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginationMeta,
  PaginationDto,
  toSkipTake,
} from '../common/dto/pagination.dto';
import { CreateHocsinhDto } from './dto/create-hocsinh.dto';
import { UpdateHocsinhDto } from './dto/update-hocsinh.dto';
import { SearchDto } from 'src/common/dto/search.dto';
import { Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class HocsinhService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHocsinhDto) {
    const { Ngaysinh, Malop, Mahs, Hotenhs, Password, ...rest } = dto as any;
    const email = `${Mahs.toLowerCase()}@gmail.com`;
    const raw =
      Password && String(Password).trim().length >= 6
        ? String(Password).trim()
        : `${Mahs}${Malop ?? ''}` || `${Mahs}`;
    const hashed = await argon2.hash(raw);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        update: { name: Hotenhs, role: Role.USER, password: hashed },
        create: { email, name: Hotenhs, role: Role.USER, password: hashed },
      });
      const data: any = {
        Mahs,
        Hotenhs,
        ...rest,
        Ngaysinh: new Date(Ngaysinh),
        userId: user.id,
      };
      if (Malop) data.Malop = Malop; // hoặc connect Lop nếu muốn: Lop.connect
      return tx.hocsinh.create({ data });
    });
  }

  async findAll(p: PaginationDto) {
    const { skip, take } = toSkipTake(p);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hocsinh.findMany({
        skip,
        take,
        include: { Lop: true, Diems: true },
        orderBy: { Mahs: 'asc' },
      }),
      this.prisma.hocsinh.count(),
    ]);
    return { items, total, page: p.page, limit: p.limit };
  }

  async findOne(Mahs: string) {
    const data = await this.prisma.hocsinh.findUnique({
      where: { Mahs },
      include: { Lop: true, Diems: true },
    });
    if (!data) {
      throw new NotFoundException('Không tìm thấy học sinh');
    }
    return data;
  }

  async update(Mahs: string, dto: UpdateHocsinhDto) {
    try {
      const { Ngaysinh, Malop, ...rest } = dto;
      return await this.prisma.hocsinh.update({
        where: { Mahs },
        data: {
          ...rest,
          ...(Ngaysinh ? { Ngaysinh: new Date(Ngaysinh) } : {}),
          ...(Malop ? { Lop: { connect: { Malop } } } : {}),
        },
      });
    } catch {
      throw new NotFoundException('Không tìm thấy học sinh');
    }
  }
  async remove(Mahs: string) {
    try {
      return await this.prisma.hocsinh.delete({ where: { Mahs } });
    } catch {
      throw new NotFoundException('Không tìm thấy học sinh');
    }
  }

  async search(dto: SearchDto) {
    const {
      q = '',
      page = 1,
      limit = 10,
      sortBy = 'Mahs',
      order = 'asc',
    } = dto;

    const where: Prisma.HocsinhWhereInput = q
      ? {
          OR: [
            { Mahs: { contains: q, mode: 'insensitive' } },
            { Hotenhs: { contains: q, mode: 'insensitive' } }, // đúng tên cột
            { Malop: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const sortable: Array<keyof Prisma.HocsinhOrderByWithRelationInput> = [
      'Mahs',
      'Hotenhs',
      'Malop',
      'Ngaysinh',
    ];
    const sortKey = (sortable as string[]).includes(sortBy) ? sortBy : 'Mahs';
    const sortOrder: Prisma.SortOrder =
      order?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, data] = await this.prisma.$transaction([
      this.prisma.hocsinh.count({ where }),
      this.prisma.hocsinh.findMany({
        where,
        skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
        take: Math.max(limit, 1),
        orderBy: { [sortKey]: sortOrder },
        include: { Lop: true, Diems: true },
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
