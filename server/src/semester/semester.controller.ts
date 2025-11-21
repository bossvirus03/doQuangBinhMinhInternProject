import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { SemesterService } from './semester.service';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/semesters')
export class SemesterController {
  constructor(private readonly svc: SemesterService) {}

  @Get()
  @Roles('ADMIN')
  async list() { return this.svc.list(); }

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: { startYear: number; term: 'HK1'|'HK2'|'HK_HE'; active?: boolean; name?: string }) {
    return this.svc.create(dto);
  }

  @Patch(':code')
  @Roles('ADMIN')
  async update(@Param('code') code: string, @Body() dto: { name?: string; active?: boolean }) {
    return this.svc.update(code, dto);
  }

  @Delete(':code')
  @Roles('ADMIN')
  async remove(@Param('code') code: string) { return this.svc.delete(code); }
}
