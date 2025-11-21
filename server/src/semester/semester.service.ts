import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Term mapping: HK1 (Aug-Dec), HK2 (Jan-May), HK_HE (Jun-Jul)
function currentTerm(): 'HK1' | 'HK2' | 'HK_HE' {
  const m = new Date().getMonth() + 1;
  if (m >= 8 && m <= 12) return 'HK1';
  if (m >= 1 && m <= 5) return 'HK2';
  return 'HK_HE';
}

@Injectable()
export class SemesterService {
  constructor(private prisma: PrismaService) {}

  private async ensureTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Semester" (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        startYear INT NOT NULL,
        term TEXT NOT NULL,
        name TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async list() {
    await this.ensureTable();
    // derive distinct (year, term) combos from Giangday & DiemRL
    const [teachings, drl, persisted] = await Promise.all([
      this.prisma.giangday.findMany({ select: { Namhoc: true, Hocky: true }, distinct: ['Namhoc', 'Hocky'] }),
      this.prisma.diemRL.findMany({ select: { Namhoc: true, Hocky: true }, distinct: ['Namhoc', 'Hocky'] }),
      this.prisma.$queryRawUnsafe<any[]>(`SELECT code, startYear, term, name, active FROM "Semester" ORDER BY startYear DESC, term ASC`),
    ]);
    const keySet = new Set<string>();
    teachings.forEach(t => keySet.add(`${t.Namhoc}::${t.Hocky}`));
    drl.forEach(d => keySet.add(`${d.Namhoc}::${d.Hocky}`));
    persisted.forEach(p => keySet.add(`${p.startYear}::${p.term}`));

    const now = new Date();
    const startYear = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const curTerm = currentTerm();

    const list = [...keySet].map(k => {
      const [yStr, term] = k.split('::');
      const y = Number(yStr);
      const code = `${term}_${y}`; // e.g. HK1_2024
      const found = persisted.find(p => p.code === code);
      return {
        code,
        startYear: y,
        term,
        name: found?.name ?? `Học kỳ ${term.replace('HK','').replace('_HE','Hè')} năm ${y}-${y+1}`,
        active: found?.active ?? (y === startYear && term === curTerm),
        persisted: !!found,
      };
    }).sort((a,b) => b.startYear - a.startYear || a.term.localeCompare(b.term));
    return list;
  }

  async create(dto: { startYear: number; term: 'HK1' | 'HK2' | 'HK_HE'; active?: boolean; name?: string }) {
    await this.ensureTable();
    const { startYear, term } = dto;
    if (!Number.isInteger(startYear) || startYear < 2000)
      throw new BadRequestException('startYear không hợp lệ');
    const validTerms = ['HK1','HK2','HK_HE'];
    if (!validTerms.includes(term)) throw new BadRequestException('term không hợp lệ');
    const code = `${term}_${startYear}`;
    const name = dto.name?.trim() || `Học kỳ ${term.replace('HK','').replace('_HE','Hè')} năm ${startYear}-${startYear+1}`;
    const active = !!dto.active;
    if (active) {
      await this.prisma.$executeRawUnsafe(`UPDATE "Semester" SET active=false`);
    }
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "Semester" (code, startYear, term, name, active) VALUES ($1,$2,$3,$4,$5)`,
        code, startYear, term, name, active
      );
    } catch(e:any) {
      throw new BadRequestException('Học kỳ đã tồn tại hoặc lỗi ghi');
    }
    return { code, startYear, term, name, active };
  }

  async update(code: string, dto: { name?: string; active?: boolean }) {
    await this.ensureTable();
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`SELECT id FROM "Semester" WHERE code=$1 LIMIT 1`, code);
    if (!rows.length) throw new NotFoundException('Không tìm thấy học kỳ');
    const sets: string[] = []; const values: any[] = [];
    if (dto.name) { sets.push(`name=$${sets.length+2}`); values.push(dto.name.trim()); }
    if (dto.active !== undefined) {
      if (dto.active) await this.prisma.$executeRawUnsafe(`UPDATE "Semester" SET active=false`);
      sets.push(`active=$${sets.length+2}`); values.push(!!dto.active);
    }
    if (!sets.length) return { code };
    const sql = `UPDATE "Semester" SET ${sets.join(', ')}, updatedAt=NOW() WHERE code=$1`;
    await this.prisma.$executeRawUnsafe(sql, code, ...values);
    return { code, ...dto };
  }

  async delete(code: string) {
    await this.ensureTable();
    const res = await this.prisma.$executeRawUnsafe(`DELETE FROM "Semester" WHERE code=$1`, code);
    return { deleted: res > 0 };
  }
}
