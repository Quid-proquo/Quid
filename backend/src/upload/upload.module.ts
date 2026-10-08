import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { IPFS_CLIENT, PinataIpfsClient } from './ipfs.client';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    // Bound to a token so tests can provide a mock IPFS client instead of
    // reaching the network.
    { provide: IPFS_CLIENT, useClass: PinataIpfsClient },
  ],
  exports: [UploadService],
})
export class UploadModule {}
