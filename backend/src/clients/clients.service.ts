import { Injectable } from '@nestjs/common';
import { toClientListItem } from './client.mapper';
import type { ClientListResponse } from './client.types';
import { ClientsRepository } from './clients.repository';
import { PAGE_SIZE, type ListClientsQuery } from './dto/list-clients.query';

@Injectable()
export class ClientsService {
  constructor(private readonly clients: ClientsRepository) {}

  async list(query: ListClientsQuery): Promise<ClientListResponse> {
    const rows = await this.clients.list(query);
    return {
      items: rows.slice(0, PAGE_SIZE).map(toClientListItem),
      page: query.page,
      limit: PAGE_SIZE,
      hasNextPage: rows.length > PAGE_SIZE,
    };
  }
}
