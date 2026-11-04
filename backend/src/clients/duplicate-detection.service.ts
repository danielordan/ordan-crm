import { Injectable } from '@nestjs/common';
import { normalizeCompanyName, normalizeEmail } from '../common/text/normalize';
import type { ClientFields } from './client.types';
import { ClientsRepository } from './clients.repository';

// Duplicate rules (ARCHITECTURE 9.3). Used when editing, and by document processing in Milestone 4.
@Injectable()
export class DuplicateDetectionService {
  constructor(private readonly clients: ClientsRepository) {}

  // Returns the ID of an existing client that matches, ignoring `excludeId` (the edited client)
  async findDuplicate(
    fields: Pick<ClientFields, 'companyName' | 'email'>,
    excludeId?: string,
  ): Promise<string | null> {
    const keys = {
      companyName: normalizeCompanyName(fields.companyName),
      email: normalizeEmail(fields.email),
    };
    if (!keys.companyName && !keys.email) return null;
    return this.clients.findDuplicateId(keys, excludeId);
  }
}
