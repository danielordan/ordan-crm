import { Injectable, Logger } from '@nestjs/common';
import type { GoogleSignInDto } from './dto/google-sign-in.dto';
import { UsersRepository, type UserRecord } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly users: UsersRepository) {}

  async signInWithGoogle(dto: GoogleSignInDto): Promise<UserRecord> {
    const user = await this.users.upsertByGoogleId(dto);
    // Only the internal ID is logged, never email or name
    this.logger.log({ userId: user.id }, 'user_signed_in');
    return user;
  }
}
