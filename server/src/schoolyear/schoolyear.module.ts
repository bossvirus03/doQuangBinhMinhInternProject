import { Module } from '@nestjs/common';
import { SchoolYearService } from './schoolyear.service';
import { SchoolYearController } from './schoolyear.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SchoolYearService],
  controllers: [SchoolYearController],
})
export class SchoolYearModule {}
