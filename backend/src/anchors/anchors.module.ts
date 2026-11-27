import { Module } from '@nestjs/common';
import { AnchorsController } from './anchors.controller';
import { AnchorDiscoveryService } from './anchor-discovery.service';

@Module({
  controllers: [AnchorsController],
  providers: [AnchorDiscoveryService],
  exports: [AnchorDiscoveryService],
})
export class AnchorsModule {}
