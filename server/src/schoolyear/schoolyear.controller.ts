import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SchoolYearService } from './schoolyear.service';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/school-years')
export class SchoolYearController {
  constructor(private readonly svc: SchoolYearService) {}

  @Get()
  @Roles('ADMIN')
  async list() {
    return this.svc.listYears();
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: { startYear: number; active?: boolean; name?: string }) {
    return this.svc.createYear(dto);
  }

  @Patch(':code')
  @Roles('ADMIN')
  async update(
    @Param('code') code: string,
    @Body() dto: { name?: string; active?: boolean },
  ) {
    return this.svc.updateYear(code, dto);
  }

  @Delete(':code')
  @Roles('ADMIN')
  async remove(@Param('code') code: string) {
    return this.svc.deleteYear(code);
  }
}
