import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MissionsController } from './missions.controller.js';
import { MissionsService } from './missions.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}
