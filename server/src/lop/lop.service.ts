import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLopDto } from './dto/create-lop.dto';
import { UpdateLopDto } from './dto/update-lop.dto';
import {
  buildPaginationMeta,
  PaginationDto,
  toSkipTake,
} from '../common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LopService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLopDto) {
    return this.prisma.lop.create({ data: dto });
  }

  async findAll(p: PaginationDto) {
    const { skip, take } = toSkipTake(p);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lop.findMany({
        skip,
        take,
        include: { GVCN: true, Hocsinhs: true },
        orderBy: { Malop: 'asc' },
      }),
      this.prisma.lop.count(),
    ]);
    return { items, total, page: p.page, limit: p.limit };
  }

  async findOne(Malop: string) {
    const data = await this.prisma.lop.findUnique({
      where: { Malop },
      include: { GVCN: true, Hocsinhs: true, Giangdays: true },
    });
    if (!data) throw new NotFoundException('Không tìm thấy lớp');
    return data;
  }

  async update(Malop: string, dto: UpdateLopDto) {
    try {
      return await this.prisma.lop.update({ where: { Malop }, data: dto });
    } catch {
      throw new NotFoundException('Không tìm thấy lớp');
    }
  }

  async remove(Malop: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.lop.findUnique({ where: { Malop } });
      if (!existing) throw new NotFoundException('Không tìm thấy lớp');

      // Purge grade aggregates tied to the class to keep relational integrity.
      await tx.diem.deleteMany({
        where: {
          OR: [{ Giangday: { Malop } }, { Hocsinh: { Malop } }],
        },
      });

      // Remove discipline scores recorded for this class.
      await tx.diemRL.deleteMany({ where: { Malop } });

      // Drop teaching assignments referencing the class before deleting it.
      await tx.giangday.deleteMany({ where: { Malop } });

      // Unassign students from the class so they can be reassigned later.
      await tx.hocsinh.updateMany({ where: { Malop }, data: { Malop: null } });

      return tx.lop.delete({ where: { Malop } });
    });
  }

  async search(dto: SearchDto) {
    const {
      q = '',
      page = 1,
      limit = 10,
      sortBy = 'Malop',
      order = 'asc',
    } = dto;

    const where: Prisma.LopWhereInput = q
      ? {
          OR: [
            { Malop: { contains: q, mode: 'insensitive' } },
            { Tenlop: { contains: q, mode: 'insensitive' } },
            { Magv: { contains: q, mode: 'insensitive' } }, // thay Namhoc -> Magv
          ],
        }
      : {};

    const sortable: Array<keyof Prisma.LopOrderByWithRelationInput> = [
      'Malop',
      'Tenlop',
      'Magv',
    ];
    const sortKey = (sortable as string[]).includes(sortBy) ? sortBy : 'Malop';
    const sortOrder: Prisma.SortOrder =
      order?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, data] = await this.prisma.$transaction([
      this.prisma.lop.count({ where }),
      this.prisma.lop.findMany({
        where,
        skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
        take: Math.max(limit, 1),
        orderBy: { [sortKey]: sortOrder },
        include: { GVCN: true, Hocsinhs: true, Giangdays: true },
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
