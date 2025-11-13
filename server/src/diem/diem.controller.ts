import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DiemService } from './diem.service';
import { CreateDiemDto } from './dto/create-diem.dto';
import { UpdateDiemDto } from './dto/update-diem.dto';
import { Hocky } from '@prisma/client';

@Controller('diem')
export class DiemController {
  constructor(private readonly diemService: DiemService) {}

  @Post()
  create(@Body() dto: CreateDiemDto) {
    return this.diemService.create(dto);
  }

  @Get()
  findAll(@Query() p: PaginationDto) {
    return this.diemService.findAll(p);
  }

  @Get(':Madiem')
  findOne(@Param('Madiem', ParseIntPipe) Madiem: number) {
    return this.diemService.findOne(Madiem);
  }

  // Lấy điểm theo khóa duy nhất (Mahs, Mamon, Namhoc, Hocky)
  @Get('by-key/find')
  findByKey(
    @Query('Mahs') Mahs: string,
    @Query('Mamon') Mamon: string,
    @Query('Namhoc') Namhoc: string,
    @Query('Hocky') HockyStr: string,
  ) {
    return this.diemService.findByKey({
      Mahs,
      Mamon,
      Namhoc: Number(Namhoc),
      Hocky: HockyStr as Hocky,
    });
  }

  // Tạo hoặc cập nhật theo khóa duy nhất (upsert)
  @Post('by-key/upsert')
  upsertByKey(@Body() dto: CreateDiemDto) {
    return this.diemService.upsertByKey(dto);
  }

  @Patch(':Madiem')
  update(
    @Param('Madiem', ParseIntPipe) Madiem: number,
    @Body() dto: UpdateDiemDto,
  ) {
    return this.diemService.update(Madiem, dto);
  }

  @Delete(':Madiem')
  remove(@Param('Madiem', ParseIntPipe) Madiem: number) {
    return this.diemService.remove(Madiem);
  }
}
