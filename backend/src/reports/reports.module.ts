import { Module } from '@nestjs/common';
import { DuplicateDetectorService } from './duplicate-detector.service';

@Module({
  providers: [DuplicateDetectorService],
  exports: [DuplicateDetectorService],
})
export class ReportsModule {}
