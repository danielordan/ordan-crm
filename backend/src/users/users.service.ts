import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { GoogleSignInDto } from './dto/google-sign-in.dto';
import { UsersRepository, type UserRecord } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly users: UsersRepository,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async signInWithGoogle(dto: GoogleSignInDto): Promise<UserRecord> {
    const user = await this.users.upsertByGoogleId(dto);
    // Only the internal ID is logged, never email or name
    this.logger.info({ userId: user.id }, 'user_signed_in');
    return user;
  }
}
