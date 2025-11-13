import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Hocky } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PrismaService } from '../prisma/prisma.service';
import { getMagvFromUserEmail } from './teacher.helper';

function toYear(v: unknown) {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  if (!Number.isInteger(n))
    throw new BadRequestException('Năm học không hợp lệ');
  return n;
}

function toDate(v: unknown) {
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime()))
    throw new BadRequestException('Ngày sinh không hợp lệ');
  return d;
}

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  // ----------- LỚP CHỦ NHIỆM -----------
  async getHomerooms(userEmail: string) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const list = await this.prisma.lop.findMany({
      where: { Magv }, // Lop.GVCN ~ Lop.Magv
      select: { Malop: true, Tenlop: true },
      orderBy: { Malop: 'asc' },
    });
    return list;
  }

  async getHomeroomStudents(userEmail: string, Malop: string) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const lop = await this.prisma.lop.findUnique({ where: { Malop } });
    if (!lop) throw new NotFoundException('Lớp không tồn tại');
    if (lop.Magv !== Magv)
      throw new ForbiddenException('Không phải lớp chủ nhiệm của bạn');

    return this.prisma.hocsinh.findMany({
      where: { Malop },
      orderBy: { Mahs: 'asc' },
    });
  }

  async addStudentToHomeroom(userEmail: string, Malop: string, dto: any) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const lop = await this.prisma.lop.findUnique({ where: { Malop } });
    if (!lop) throw new NotFoundException('Lớp không tồn tại');
    if (lop.Magv !== Magv)
      throw new ForbiddenException('Không phải lớp chủ nhiệm của bạn');

    // Ngaysinh trong schema là bắt buộc
    return this.prisma.hocsinh.create({
      data: {
        Mahs: dto.Mahs,
        Hotenhs: dto.Hotenhs,
        Gioitinh: dto.Gioitinh,
        Ngaysinh: toDate(dto.Ngaysinh),
        Diachi: dto.Diachi ?? null,
        Malop,
      } as any,
    });
  }

  async updateStudentInHomeroom(
    userEmail: string,
    Malop: string,
    Mahs: string,
    dto: any,
  ) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const lop = await this.prisma.lop.findUnique({ where: { Malop } });
    if (!lop) throw new NotFoundException('Lớp không tồn tại');
    if (lop.Magv !== Magv)
      throw new ForbiddenException('Không phải lớp chủ nhiệm của bạn');

    const hs = await this.prisma.hocsinh.findUnique({ where: { Mahs } });
    if (!hs || hs.Malop !== Malop)
      throw new ForbiddenException('HS không thuộc lớp này');

    return this.prisma.hocsinh.update({
      where: { Mahs },
      data: {
        Hotenhs: dto.Hotenhs,
        Gioitinh: dto.Gioitinh,
        Ngaysinh: dto.Ngaysinh ? toDate(dto.Ngaysinh) : hs.Ngaysinh,
        Diachi: dto.Diachi ?? hs.Diachi,
      },
    });
  }

  async removeStudentFromHomeroom(
    userEmail: string,
    Malop: string,
    Mahs: string,
  ) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const lop = await this.prisma.lop.findUnique({ where: { Malop } });
    if (!lop) throw new NotFoundException('Lớp không tồn tại');
    if (lop.Magv !== Magv)
      throw new ForbiddenException('Không phải lớp chủ nhiệm của bạn');

    const hs = await this.prisma.hocsinh.findUnique({ where: { Mahs } });
    if (!hs || hs.Malop !== Malop)
      throw new ForbiddenException('HS không thuộc lớp này');

    return this.prisma.hocsinh.delete({ where: { Mahs } });
  }

  // ----------- LỚP PHỤ TRÁCH (DẠY LỚP/MÔN) -----------
  async getTeachings(userEmail: string) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const list = await this.prisma.giangday.findMany({
      where: { Magv },
      include: { Lop: true, Monhoc: true },
      orderBy: [{ Namhoc: 'desc' }, { Hocky: 'desc' }],
    });
    // Trả về cho FE tự lọc theo năm/học kỳ
    return list.map((g) => ({
      Malop: g.Malop,
      Tenlop: g.Lop?.Tenlop ?? g.Malop,
      Mamon: g.Mamon,
      Tenmon: g.Monhoc?.Tenmon ?? g.Mamon,
      Namhoc: g.Namhoc,
      Hocky: g.Hocky,
    }));
  }

  async getTeachingStudents(userEmail: string, Malop: string) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const has = await this.prisma.giangday.findFirst({
      where: { Magv, Malop },
    });
    if (!has) throw new ForbiddenException('Bạn không dạy lớp này');
    return this.prisma.hocsinh.findMany({
      where: { Malop },
      orderBy: { Mahs: 'asc' },
    });
  }

  // ----------- ĐIỂM RÈN LUYỆN (DRL) -----------
  async getDRLByClass(
    userEmail: string,
    q: {
      Malop: string;
      Namhoc?: number | string;
      Hocky: 'HK1' | 'HK2' | 'HK_HE';
    },
  ) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const lop = await this.prisma.lop.findUnique({ where: { Malop: q.Malop } });
    if (!lop) throw new NotFoundException('Lớp không tồn tại');
    if (lop.Magv !== Magv)
      throw new ForbiddenException('Không phải lớp chủ nhiệm của bạn');

    const where: Prisma.DiemRLWhereInput = {
      Malop: q.Malop,
      Hocky: q.Hocky,
      ...(q.Namhoc !== undefined && q.Namhoc !== null
        ? { Namhoc: toYear(q.Namhoc) }
        : {}),
    };

    const list = await this.prisma.diemRL.findMany({
      where,
      include: { Hocsinh: true },
      orderBy: { id: 'desc' },
    });

    return list.map((d) => ({
      id: d.id,
      Mahs: d.Mahs,
      Hotenhs: d.Hocsinh?.Hotenhs,
      Malop: d.Malop,
      Nam: d.Namhoc,
      Hocky: d.Hocky,
      Diem: d.Diem,
      Note: d.Note,
    }));
  }

  async createDRL(
    userEmail: string,
    dto: {
      Mahs: string;
      Malop: string;
      Namhoc: number | string;
      Hocky: 'HK1' | 'HK2' | 'HK_HE';
      Diem: number;
      Note?: string;
    },
  ) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const lop = await this.prisma.lop.findUnique({
      where: { Malop: dto.Malop },
    });
    if (!lop) throw new NotFoundException('Lớp không tồn tại');
    if (lop.Magv !== Magv)
      throw new ForbiddenException('Không phải lớp chủ nhiệm của bạn');

    const hs = await this.prisma.hocsinh.findUnique({
      where: { Mahs: dto.Mahs },
    });
    if (!hs || hs.Malop !== dto.Malop)
      throw new ForbiddenException('HS không thuộc lớp này');

    return this.prisma.diemRL.create({
      data: {
        Mahs: dto.Mahs,
        Malop: dto.Malop,
        Namhoc: toYear(dto.Namhoc),
        Hocky: dto.Hocky,
        Diem: dto.Diem,
        Note: dto.Note ?? null,
        createdBy: Magv,
      },
    });
  }

  async updateDRL(
    userEmail: string,
    id: number,
    dto: Partial<{
      Mahs: string;
      Malop: string;
      Namhoc: number | string;
      Hocky: 'HK1' | 'HK2' | 'HK_HE';
      Diem: number;
      Note: string;
    }>,
  ) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const rec = await this.prisma.diemRL.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('DRL not found');

    // xác thực quyền theo lớp chủ nhiệm hiện tại của teacher
    const lop = await this.prisma.lop.findUnique({
      where: { Malop: rec.Malop },
    });
    if (!lop || lop.Magv !== Magv) throw new ForbiddenException();

    // nếu đổi Mahs/Malop/Năm/HK, vẫn đảm bảo HS thuộc lớp và lớp thuộc GV
    let Mahs = rec.Mahs;
    let Malop = rec.Malop;
    let Namhoc = rec.Namhoc;
    let Hocky = rec.Hocky;

    if (dto.Malop && dto.Malop !== Malop) {
      const lop2 = await this.prisma.lop.findUnique({
        where: { Malop: dto.Malop },
      });
      if (!lop2 || lop2.Magv !== Magv)
        throw new ForbiddenException('Không phải lớp CN của bạn');
      Malop = dto.Malop;
    }

    if (dto.Mahs && dto.Mahs !== Mahs) {
      const hs2 = await this.prisma.hocsinh.findUnique({
        where: { Mahs: dto.Mahs },
      });
      if (!hs2 || hs2.Malop !== Malop)
        throw new ForbiddenException('HS không thuộc lớp');
      Mahs = dto.Mahs;
    }

    if (dto.Namhoc !== undefined) Namhoc = toYear(dto.Namhoc);
    if (dto.Hocky) Hocky = dto.Hocky;

    return this.prisma.diemRL.update({
      where: { id },
      data: {
        Mahs,
        Malop,
        Namhoc,
        Hocky,
        Diem: dto.Diem ?? rec.Diem,
        Note: dto.Note ?? rec.Note,
      },
    });
  }

  async deleteDRL(userEmail: string, id: number) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const rec = await this.prisma.diemRL.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('DRL not found');
    const lop = await this.prisma.lop.findUnique({
      where: { Malop: rec.Malop },
    });
    if (!lop || lop.Magv !== Magv) throw new ForbiddenException();
    return this.prisma.diemRL.delete({ where: { id } });
  }

  async getDRLByStudent(userEmail: string, Mahs: string) {
    const Magv = await getMagvFromUserEmail(this.prisma, userEmail);
    const hs = await this.prisma.hocsinh.findUnique({
      where: { Mahs },
      include: { Lop: true },
    });
    if (!hs) return [];
    if (!hs.Lop || hs.Lop.Magv !== Magv)
      throw new ForbiddenException('HS không thuộc lớp CN của bạn');

    return this.prisma.diemRL.findMany({
      where: { Mahs },
      orderBy: [{ Namhoc: 'desc' }, { Hocky: 'desc' }],
    });
  }

  // ========== ADMIN CRUD GIÁO VIÊN (gộp từ GiaovienService) ==========
  adminCreateTeacher(dto: CreateTeacherDto) {
    const {
      Ngaysinh,
      ChuNhiemMalop = [],
      MonPhuTrachMamon = [],
      LopPhuTrachMalop = [],
      Email,
      Magv,
      Hotengv,
      Password,
      ...rest
    } = dto as any;
    return this.prisma.$transaction(async (tx) => {
      // Tạo hoặc cập nhật User trước, rồi liên kết bằng userId
      const email = Email ?? `${String(Magv).toLowerCase()}@gmail.com`;
      const raw =
        Password && String(Password).trim().length >= 6
          ? String(Password).trim()
          : `teacher${Magv}`;
      const hashed = await argon2.hash(raw);
      const user = await tx.user.upsert({
        where: { email },
        update: { name: Hotengv, role: 'TEACHER', password: hashed },
        create: { email, name: Hotengv, role: 'TEACHER', password: hashed },
      });

      const gv = await tx.giaovien.create({
        data: {
          Magv,
          Hotengv,
          Email,
          ...(Ngaysinh ? { Ngaysinh: new Date(Ngaysinh) } : {}),
          ...rest,
          userId: user.id,
        },
      });

      // Gán lớp CN nếu có
      if (Array.isArray(ChuNhiemMalop) && ChuNhiemMalop.length > 0) {
        await tx.lop.updateMany({
          where: { Malop: { in: ChuNhiemMalop } },
          data: { Magv: gv.Magv },
        });
      }
      // Gán môn phụ trách nếu có
      if (Array.isArray(MonPhuTrachMamon) && MonPhuTrachMamon.length > 0) {
        await tx.monhoc.updateMany({
          where: { Mamon: { in: MonPhuTrachMamon } },
          data: { Magv: gv.Magv },
        });
      }

      // Lớp phụ trách -> tạo bản ghi giảng dạy mặc định cho HK1 của năm học hiện hành
      if (
        Array.isArray(LopPhuTrachMalop) &&
        LopPhuTrachMalop.length > 0 &&
        Array.isArray(MonPhuTrachMamon) &&
        MonPhuTrachMamon.length > 0
      ) {
        const now = new Date();
        const month = now.getMonth() + 1; // 1..12
        const Namhoc = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        const hk: Hocky = 'HK1';
        const data = LopPhuTrachMalop.flatMap((Malop: string) =>
          MonPhuTrachMamon.map((Mamon: string) => ({
            Namhoc,
            Hocky: hk,
            Magv: gv.Magv,
            Malop,
            Mamon,
          })),
        );
        if (data.length)
          await tx.giangday.createMany({ data, skipDuplicates: true });
      }
      return gv;
    });
  }

  async adminFindAllTeachers(p: { page?: number; limit?: number }) {
    const page = Math.max(Number(p.page) || 1, 1);
    const limit = Math.max(Number(p.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.giaovien.findMany({
        skip,
        take: limit,
        include: { ChuNhiem: true, MonPhuTrach: true },
      }),
      this.prisma.giaovien.count(),
    ]);
    return { items, total, page, limit };
  }

  async adminSearchTeachers(dto: any) {
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
    const take = Math.max(Number(limit), 1);
    const skip = (Math.max(Number(page), 1) - 1) * take;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.giaovien.count({ where }),
      this.prisma.giaovien.findMany({
        where,
        skip,
        take,
        orderBy: { [sortKey]: sortOrder },
        include: { ChuNhiem: true, MonPhuTrach: true, Giangdays: true },
      }),
    ]);
    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortKey,
        order: sortOrder,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async adminFindTeacher(Magv: string) {
    const data = await this.prisma.giaovien.findUnique({
      where: { Magv },
      include: { ChuNhiem: true, MonPhuTrach: true, Giangdays: true },
    });
    if (!data) throw new NotFoundException('Không tìm thấy giáo viên');
    return data;
  }

  async adminUpdateTeacher(Magv: string, dto: UpdateTeacherDto) {
    try {
      const {
        Ngaysinh,
        ChuNhiemMalop = undefined,
        LopPhuTrachMalop = undefined,
        MonPhuTrachMamon = undefined,
        ...rest
      } = dto as any;
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.giaovien.update({
          where: { Magv },
          data: {
            ...rest,
            ...(Ngaysinh ? { Ngaysinh: new Date(Ngaysinh) } : {}),
          },
        });

        // Đồng bộ lớp chủ nhiệm nếu FE gửi mảng
        if (Array.isArray(ChuNhiemMalop)) {
          const current = await tx.lop.findMany({
            where: { Magv },
            select: { Malop: true },
          });
          const currentSet = new Set(current.map((c) => c.Malop));
          const nextSet = new Set(ChuNhiemMalop);
          const toRemove = [...currentSet].filter((id) => !nextSet.has(id));
          const toAdd = [...nextSet].filter((id) => !currentSet.has(id));
          if (toRemove.length)
            await tx.lop.updateMany({
              where: { Malop: { in: toRemove }, Magv },
              data: { Magv: null },
            });
          if (toAdd.length)
            await tx.lop.updateMany({
              where: { Malop: { in: toAdd } },
              data: { Magv },
            });
        }

        // Đồng bộ môn phụ trách nếu FE gửi mảng
        if (Array.isArray(MonPhuTrachMamon)) {
          const current = await tx.monhoc.findMany({
            where: { Magv },
            select: { Mamon: true },
          });
          const currentSet = new Set(current.map((c) => c.Mamon));
          const nextSet = new Set(MonPhuTrachMamon);
          const toRemove = [...currentSet].filter((id) => !nextSet.has(id));
          const toAdd = [...nextSet].filter((id) => !currentSet.has(id));
          if (toRemove.length)
            await tx.monhoc.updateMany({
              where: { Mamon: { in: toRemove }, Magv },
              data: { Magv: null },
            });
          if (toAdd.length)
            await tx.monhoc.updateMany({
              where: { Mamon: { in: toAdd } },
              data: { Magv },
            });
        }

        // Lớp phụ trách -> thêm giảng dạy mặc định cho HK1 của năm học hiện hành theo các cặp lớp-môn
        if (
          Array.isArray(LopPhuTrachMalop) &&
          Array.isArray(MonPhuTrachMamon)
        ) {
          const now = new Date();
          const month = now.getMonth() + 1;
          const Namhoc = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
          const hk: Hocky = 'HK1';
          const data = LopPhuTrachMalop.flatMap((Malop: string) =>
            MonPhuTrachMamon.map((Mamon: string) => ({
              Namhoc,
              Hocky: hk,
              Magv,
              Malop,
              Mamon,
            })),
          );
          if (data.length)
            await tx.giangday.createMany({ data, skipDuplicates: true });
        }

        return updated;
      });
    } catch {
      throw new NotFoundException('Không tìm thấy giáo viên');
    }
  }

  async adminRemoveTeacher(Magv: string) {
    try {
      return await this.prisma.giaovien.delete({ where: { Magv } });
    } catch {
      throw new NotFoundException('Không tìm thấy giáo viên');
    }
  }
}
