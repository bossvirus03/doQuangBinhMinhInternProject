import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher')
export class TeacherController {
  constructor(private readonly svc: TeacherService) {}

  // ================= SELF (ME) =================
  // Lớp chủ nhiệm
  @Get('me/homerooms') homerooms(@Req() req) {
    return this.svc.getHomerooms(req.user.email);
  }
  @Get('me/homerooms/:malop/students') homeroomStudents(
    @Req() req,
    @Param('malop') malop: string,
  ) {
    return this.svc.getHomeroomStudents(req.user.email, malop);
  }
  @Post('me/homerooms/:malop/students') addStudent(
    @Req() req,
    @Param('malop') malop: string,
    @Body() dto: any,
  ) {
    return this.svc.addStudentToHomeroom(req.user.email, malop, dto);
  }
  @Put('me/homerooms/:malop/students/:mahs') updateStudent(
    @Req() req,
    @Param('malop') malop: string,
    @Param('mahs') mahs: string,
    @Body() dto: any,
  ) {
    return this.svc.updateStudentInHomeroom(req.user.email, malop, mahs, dto);
  }
  @Delete('me/homerooms/:malop/students/:mahs') removeStudent(
    @Req() req,
    @Param('malop') malop: string,
    @Param('mahs') mahs: string,
  ) {
    return this.svc.removeStudentFromHomeroom(req.user.email, malop, mahs);
  }

  // Lớp phụ trách (giảng dạy)
  @Get('me/teachings') teachings(@Req() req) {
    return this.svc.getTeachings(req.user.email);
  }
  @Get('me/classes/:malop/students') teachingStudents(
    @Req() req,
    @Param('malop') malop: string,
  ) {
    return this.svc.getTeachingStudents(req.user.email, malop);
  }

  // Điểm rèn luyện
  @Get('me/drl') getDRL(
    @Req() req,
    @Query('Malop') Malop: string,
    @Query('Namhoc') Namhoc: string,
    @Query('Hocky') Hocky: string,
  ) {
    return this.svc.getDRLByClass(req.user.email, {
      Malop,
      Namhoc: +Namhoc,
      Hocky: Hocky as any,
    });
  }
  @Post('me/drl') createDRL(@Req() req, @Body() dto: any) {
    return this.svc.createDRL(req.user.email, dto);
  }
  @Put('me/drl/:id') updateDRL(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateDRL(req.user.email, +id, dto);
  }
  @Delete('me/drl/:id') deleteDRL(@Req() req, @Param('id') id: string) {
    return this.svc.deleteDRL(req.user.email, +id);
  }
  @Get('me/drl/student/:mahs') getDRLByStudent(
    @Req() req,
    @Param('mahs') mahs: string,
  ) {
    return this.svc.getDRLByStudent(req.user.email, mahs);
  }

  // ================= ADMIN CRUD (gộp từ giaovien) =================
  @Post() create(@Body() dto: CreateTeacherDto) {
    return this.svc.adminCreateTeacher(dto);
  }
  @Get() findAll(@Query() p: { page?: number; limit?: number }) {
    return this.svc.adminFindAllTeachers(p);
  }
  @Get('search') search(@Query() dto: any) {
    return this.svc.adminSearchTeachers(dto);
  }
  @Get(':Magv') findOne(@Param('Magv') Magv: string) {
    return this.svc.adminFindTeacher(Magv);
  }
  @Patch(':Magv') update(
    @Param('Magv') Magv: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.svc.adminUpdateTeacher(Magv, dto);
  }
  @Delete(':Magv') remove(@Param('Magv') Magv: string) {
    return this.svc.adminRemoveTeacher(Magv);
  }
}
