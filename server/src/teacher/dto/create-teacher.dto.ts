import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ArrayUnique,
  MinLength,
} from 'class-validator';
import { GioiTinh } from '@prisma/client';

export class CreateTeacherDto {
  @IsString() Magv: string;
  @IsString() Hotengv: string;
  @IsOptional() @IsDateString() Ngaysinh?: string;
  @IsOptional() @IsEnum(GioiTinh) Gioitinh?: GioiTinh;
  @IsOptional() @IsString() SDT?: string;
  @IsOptional() @IsEmail() Email?: string;

  // Optional initial password for the linked User; if omitted, a default will be generated
  @IsOptional()
  @IsString()
  @MinLength(6)
  Password?: string;

  // Gán/chỉnh sửa lớp chủ nhiệm và môn phụ trách (tùy chọn)
  @IsOptional() @IsArray() @ArrayUnique() ChuNhiemMalop?: string[];
  @IsOptional() @IsArray() @ArrayUnique() MonPhuTrachMamon?: string[];

  // Chọn các lớp phụ trách (giảng dạy) - chỉ thu thập Malop, phần tạo Giangday sẽ xử lý ở màn khác
  @IsOptional() @IsArray() @ArrayUnique() LopPhuTrachMalop?: string[];
}
