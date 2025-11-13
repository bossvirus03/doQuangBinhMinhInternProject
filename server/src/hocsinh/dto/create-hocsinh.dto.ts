import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GioiTinh } from '@prisma/client';

export class CreateHocsinhDto {
  @IsString() Mahs: string;
  @IsString() Hotenhs: string;
  @IsOptional() @IsString() Diachi?: string;
  @IsDateString() Ngaysinh: string;
  @IsEnum(GioiTinh) Gioitinh: GioiTinh;
  @IsOptional() @IsString() Malop?: string;

  // Optional initial password for the linked User; if omitted, a default will be generated
  @IsOptional()
  @IsString()
  @MinLength(6)
  Password?: string;
}
