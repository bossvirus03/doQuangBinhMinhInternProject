import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, toSkipTake } from '../common/dto/pagination.dto';
import { CreateDiemDto } from './dto/create-diem.dto';
import { UpdateDiemDto } from './dto/update-diem.dto';

@Injectable()
export class DiemService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDiemDto) {
    try {
      return await this.prisma.diem.create({ data: dto });
    } catch {
      // vi phạm @@unique([Mahs, Mamon, Namhoc, Hocky]) hoặc FK
      throw new BadRequestException(
        'Điểm trùng khóa duy nhất hoặc FK không hợp lệ',
      );
    }
  }

  async findAll(p: PaginationDto = new PaginationDto()) {
    const { skip, take } = toSkipTake(p);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.diem.findMany({
        skip,
        take,
        include: {
          Hocsinh: true,
          Monhoc: true,
          Giangday: true,
          Chitietdiems: true,
        },
        orderBy: [{ Namhoc: 'desc' }, { Hocky: 'asc' }],
      }),
      this.prisma.diem.count(),
    ]);
    return { items, total, page: p.page, limit: p.limit };
  }

  async findOne(Madiem: number) {
    const data = await this.prisma.diem.findUnique({
      where: { Madiem },
      include: {
        Hocsinh: true,
        Monhoc: true,
        Giangday: true,
        Chitietdiems: true,
      },
    });
    if (!data) throw new NotFoundException('Không tìm thấy điểm');
    return data;
  }

  async findByKey(key: {
    Mahs: string;
    Mamon: string;
    Namhoc: number;
    Hocky: any;
  }) {
    if (!key?.Mahs || !key?.Mamon || !key?.Namhoc || !key?.Hocky) {
      throw new BadRequestException('Thiếu tham số khóa');
    }
    return this.prisma.diem.findUnique({
      where: {
        Mahs_Mamon_Namhoc_Hocky: {
          Mahs: key.Mahs,
          Mamon: key.Mamon,
          Namhoc: key.Namhoc,
          Hocky: key.Hocky,
        },
      },
      include: { Hocsinh: true, Monhoc: true },
    });
  }

  async upsertByKey(dto: CreateDiemDto) {
    const { Mahs, Mamon, Namhoc, Hocky, ...rest } = dto as any;
    if (!Mahs || !Mamon || !Namhoc || !Hocky) {
      throw new BadRequestException(
        'Thiếu khóa duy nhất (Mahs, Mamon, Namhoc, Hocky)',
      );
    }
    try {
      return await this.prisma.diem.upsert({
        where: {
          Mahs_Mamon_Namhoc_Hocky: { Mahs, Mamon, Namhoc, Hocky },
        },
        update: { ...rest },
        create: { Mahs, Mamon, Namhoc, Hocky, ...rest },
      });
    } catch (e) {
      throw new BadRequestException(
        'Upsert điểm thất bại. Vui lòng kiểm tra khóa hoặc FK.',
      );
    }
  }

  async update(Madiem: number, dto: UpdateDiemDto) {
    try {
      return await this.prisma.diem.update({ where: { Madiem }, data: dto });
    } catch {
      throw new NotFoundException('Không tìm thấy điểm');
    }
  }

  async remove(Madiem: number) {
    try {
      return await this.prisma.diem.delete({ where: { Madiem } });
    } catch {
      throw new NotFoundException('Không tìm thấy điểm');
    }
  }
}
