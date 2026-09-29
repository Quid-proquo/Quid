import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';

@Module({
  imports: [PrismaModule, AuthModule, AiModule],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}
