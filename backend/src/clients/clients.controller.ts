import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { RequestActor, type Actor } from '../common/request-actor';
import { parseOrBadRequest } from '../common/validation/parse';
import type { Client, ClientListResponse } from './client.types';
import { ClientsService } from './clients.service';
import { listClientsQuerySchema } from './dto/list-clients.query';
import { updateClientSchema } from './dto/update-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@Query() query: Record<string, unknown>): Promise<ClientListResponse> {
    return this.clients.list(parseOrBadRequest(listClientsQuerySchema, query));
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Client> {
    return this.clients.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @RequestActor() actor: Actor,
  ): Promise<Client> {
    return this.clients.update(id, parseOrBadRequest(updateClientSchema, body), actor);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', ParseUUIDPipe) id: string, @RequestActor() actor: Actor): Promise<void> {
    return this.clients.delete(id, actor);
  }
}
