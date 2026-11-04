import { Module } from '@nestjs/common';
import { ClientStatusService } from './client-status.service';
import { ClientsController } from './clients.controller';
import { ClientsRepository } from './clients.repository';
import { ClientsService } from './clients.service';
import { DuplicateDetectionService } from './duplicate-detection.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ClientsRepository, ClientStatusService, DuplicateDetectionService],
  exports: [ClientsRepository, ClientStatusService, DuplicateDetectionService],
})
export class ClientsModule {}
