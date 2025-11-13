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

  // Lấy điểm theo khóa duy nhất (Mahs, Mamon, Namhoc, Hocky)
  @Get('by-key/find')
  findByKey(
    @Query('Mahs') Mahs: string,
    @Query('Mamon') Mamon: string,
    @Query('Namhoc', ParseIntPipe) Namhoc: number,
    @Query('Hocky') HockyStr: string,
  ) {
    const validHocky = ['HK1', 'HK2', 'HK_HE'];
    if (!Mahs || !Mamon || !Namhoc || !HockyStr) {
      return {
        error: 'Thiếu tham số bắt buộc',
        required: ['Mahs', 'Mamon', 'Namhoc', 'Hocky'],
      };
    }
    if (!validHocky.includes(HockyStr)) {
      return {
        error: 'Hocky không hợp lệ',
        value: HockyStr,
        allowed: validHocky,
      };
    }
    return this.diemService.findByKey({
      Mahs,
      Mamon,
      Namhoc,
      Hocky: HockyStr as Hocky,
    });
  }

  // Tạo hoặc cập nhật theo khóa duy nhất (upsert)
  @Post('by-key/upsert')
  upsertByKey(@Body() dto: CreateDiemDto) {
    return this.diemService.upsertByKey(dto);
  }

  // Danh sách điểm theo lớp + môn + năm + học kỳ (lọc qua Hocsinh.Malop)
  @Get('by-teaching')
  findByTeaching(
    @Query('Malop') Malop: string,
    @Query('Mamon') Mamon: string,
    @Query('Namhoc', ParseIntPipe) Namhoc: number,
    @Query('Hocky') HockyStr: string,
  ) {
    const validHocky = ['HK1', 'HK2', 'HK_HE'];
    if (!Malop || !Mamon || !Namhoc || !HockyStr) {
      return {
        error: 'Thiếu tham số bắt buộc',
        required: ['Malop', 'Mamon', 'Namhoc', 'Hocky'],
      };
    }
    if (!validHocky.includes(HockyStr)) {
      return {
        error: 'Hocky không hợp lệ',
        value: HockyStr,
        allowed: validHocky,
      };
    }
    return this.diemService.findByTeaching({
      Malop,
      Mamon,
      Namhoc,
      Hocky: HockyStr as Hocky,
    });
  }

  // Đặt sau cùng: lấy theo id
  @Get(':Madiem')
  findOne(@Param('Madiem', ParseIntPipe) Madiem: number) {
    return this.diemService.findOne(Madiem);
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
