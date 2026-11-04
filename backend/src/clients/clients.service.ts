import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeCompanyName, normalizeEmail, phoneToDigits } from '../common/text/normalize';
import { isValidEmail, isValidPhone } from '../common/validation/contact';
import { toClient, toClientFields, toClientListItem } from './client.mapper';
import { ClientStatusService } from './client-status.service';
import type { Client, ClientFields, ClientListResponse, ClientRow } from './client.types';
import { ClientsRepository } from './clients.repository';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { PAGE_SIZE, type ListClientsQuery } from './dto/list-clients.query';
import type { UpdateClientDto } from './dto/update-client.dto';

const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === POSTGRES_UNIQUE_VIOLATION;
}

function duplicateClient(): ConflictException {
  return new ConflictException({
    error: 'DUPLICATE_CLIENT',
    message: 'A client with this company name and email already exists.',
  });
}

// Only a changed value is checked, so an old or extracted value that does not fit the format
// never blocks fixing another field (ARCHITECTURE ADR-27). Empty is allowed.
function assertValidContactFields(changes: UpdateClientDto, current: ClientRow): void {
  const invalid: string[] = [];
  if (changes.email && changes.email !== current.email && !isValidEmail(changes.email)) {
    invalid.push('email');
  }
  if (changes.phone && changes.phone !== current.phone && !isValidPhone(changes.phone)) {
    invalid.push('phone');
  }
  if (invalid.length) throw new BadRequestException(`Invalid value for: ${invalid.join(', ')}.`);
}

@Injectable()
export class ClientsService {
  constructor(
    private readonly clients: ClientsRepository,
    private readonly status: ClientStatusService,
    private readonly duplicates: DuplicateDetectionService,
  ) {}

  async list(query: ListClientsQuery): Promise<ClientListResponse> {
    const rows = await this.clients.list(query);
    return {
      items: rows.slice(0, PAGE_SIZE).map(toClientListItem),
      page: query.page,
      limit: PAGE_SIZE,
      hasNextPage: rows.length > PAGE_SIZE,
    };
  }

  async getById(id: string): Promise<Client> {
    const row = await this.clients.findById(id);
    if (!row) throw new NotFoundException('Client not found.');
    return toClient(row);
  }

  async update(id: string, changes: UpdateClientDto): Promise<Client> {
    const current = await this.clients.findById(id);
    if (!current) throw new NotFoundException('Client not found.');
    assertValidContactFields(changes, current);

    const fields: ClientFields = { ...toClientFields(current), ...changes };
    const companyNameNormalized = normalizeCompanyName(fields.companyName);
    const emailNormalized = normalizeEmail(fields.email);

    // Only an edit of the name or email can create a duplicate (PRD 4.6, ARCHITECTURE ADR-26)
    const identityChanged =
      companyNameNormalized !== current.company_name_normalized ||
      emailNormalized !== current.email_normalized;
    if (identityChanged && (await this.duplicates.findDuplicate(fields, id))) {
      throw duplicateClient();
    }

    try {
      const updated = await this.clients.update(id, {
        ...fields,
        ...this.status.compute(fields),
        companyNameNormalized,
        emailNormalized,
        phoneDigits: phoneToDigits(fields.phone),
      });
      if (!updated) throw new NotFoundException('Client not found.');
      return toClient(updated);
    } catch (error) {
      // Two simultaneous saves can both pass the check above; the unique index decides (11.5)
      if (isUniqueViolation(error)) throw duplicateClient();
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.clients.delete(id);
    if (!deleted) throw new NotFoundException('Client not found.');
  }
}
