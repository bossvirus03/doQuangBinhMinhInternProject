import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolYearService {
  constructor(private prisma: PrismaService) {}

  private async ensureTable() {
    // Tạo bảng nếu chưa có (raw SQL vì chưa migrate schema prisma 7)
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SchoolYear" (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        startYear INT NOT NULL,
        endYear INT NOT NULL,
        name TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async listYears() {
    await this.ensureTable();

    // Distinct từ data thực tế
    const [giangdayYears, diemRLYears, persisted] = await Promise.all([
      this.prisma.giangday.findMany({ distinct: ['Namhoc'], select: { Namhoc: true } }),
      this.prisma.diemRL.findMany({ distinct: ['Namhoc'], select: { Namhoc: true } }),
      this.prisma.$queryRawUnsafe<any[]>(`SELECT code, startYear, endYear, name, active FROM "SchoolYear" ORDER BY startYear DESC`),
    ]);

    const set = new Set<number>();
    giangdayYears.forEach((y) => set.add(y.Namhoc));
    diemRLYears.forEach((y) => set.add(y.Namhoc));
    persisted.forEach((p) => set.add(Number(p.startYear)));

    // năm hiện tại (logic tháng >= 8)
    const now = new Date();
    const currentStart = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;

    const merged = [...set]
      .sort((a, b) => b - a)
      .map((startYear) => {
        const endYear = startYear + 1;
        const code = `NH${String(startYear).slice(2)}${String(endYear).slice(2)}`;
        const found = persisted.find((p) => p.code === code);
        return {
          code,
          startYear,
          endYear,
          name: found?.name ?? `Năm học ${startYear}-${endYear}`,
          active: found?.active ?? (startYear === currentStart),
          persisted: !!found,
        };
      });
    return merged;
  }

  async createYear(dto: { startYear: number; active?: boolean; name?: string }) {
    await this.ensureTable();
    const { startYear } = dto;
    if (!Number.isInteger(startYear) || startYear < 2000)
      throw new BadRequestException('startYear không hợp lệ');
    const endYear = startYear + 1;
    const code = `NH${String(startYear).slice(2)}${String(endYear).slice(2)}`;
    const name = dto.name?.trim() || `Năm học ${startYear}-${endYear}`;
    const active = !!dto.active;
    if (active) {
      await this.prisma.$executeRawUnsafe(`UPDATE "SchoolYear" SET active=false`);
    }
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "SchoolYear" (code, startYear, endYear, name, active) VALUES ($1, $2, $3, $4, $5)`,
        code,
        startYear,
        endYear,
        name,
        active,
      );
    } catch (e: any) {
      throw new BadRequestException('Năm học đã tồn tại hoặc lỗi ghi');
    }
    return { code, startYear, endYear, name, active };
  }

  async updateYear(code: string, dto: { name?: string; active?: boolean }) {
    await this.ensureTable();
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, code FROM "SchoolYear" WHERE code=$1 LIMIT 1`,
      code,
    );
    if (!rows.length) throw new NotFoundException('Không tìm thấy năm học');
    const sets: string[] = [];
    const values: any[] = [];
    if (dto.name) {
      sets.push(`name=$${sets.length + 2}`);
      values.push(dto.name.trim());
    }
    if (dto.active !== undefined) {
      if (dto.active) {
        await this.prisma.$executeRawUnsafe(`UPDATE "SchoolYear" SET active=false`);
      }
      sets.push(`active=$${sets.length + 2}`);
      values.push(!!dto.active);
    }
    if (!sets.length) return { code }; // nothing to update
    const sql = `UPDATE "SchoolYear" SET ${sets.join(', ')}, updatedAt=NOW() WHERE code=$1`;
    await this.prisma.$executeRawUnsafe(sql, code, ...values);
    return { code, ...dto };
  }

  async deleteYear(code: string) {
    await this.ensureTable();
    const res = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "SchoolYear" WHERE code=$1`,
      code,
    );
    // postgres returns number of affected rows; if 0 => not found
    return { deleted: res > 0 };
  }
}
