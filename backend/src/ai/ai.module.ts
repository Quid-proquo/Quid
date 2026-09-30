import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiProviderService } from './ai-provider.service';
import { AiSummaryService } from './ai-summary.service';

/**
 * Issue #315 — AI summary and sentiment for submissions.
 *
 * Exported so the missions module (and later the indexer) can enqueue
 * processing as soon as submission text is available.
 */
@Module({
  imports: [PrismaModule],
  providers: [AiProviderService, AiSummaryService],
  exports: [AiSummaryService],
})
export class AiModule {}
