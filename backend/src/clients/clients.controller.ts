import { Controller, Get, Query } from '@nestjs/common';
import { parseOrBadRequest } from '../common/validation/parse';
import type { ClientListResponse } from './client.types';
import { ClientsService } from './clients.service';
import { listClientsQuerySchema } from './dto/list-clients.query';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@Query() query: Record<string, unknown>): Promise<ClientListResponse> {
    return this.clients.list(parseOrBadRequest(listClientsQuerySchema, query));
  }
}
