import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { GoogleSignInDto } from './dto/google-sign-in.dto';
import type { PasswordCredentialsDto } from './dto/password-credentials.dto';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password-hash';
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
    // Only the internal ID is logged, never email, name or username
    this.logger.info({ userId: user.id }, 'user_signed_in');
    return user;
  }

  async register({ username, password }: PasswordCredentialsDto): Promise<UserRecord> {
    const user = await this.users.createWithPassword(username, await hashPassword(password));
    if (!user) {
      throw new ConflictException({
        error: 'USERNAME_TAKEN',
        message: 'This username is already taken.',
      });
    }
    this.logger.info({ userId: user.id }, 'user_registered');
    return user;
  }

  async signInWithPassword({ username, password }: PasswordCredentialsDto): Promise<UserRecord> {
    const found = await this.users.findByUsername(username);
    // A missing user still runs a hash check, so both failures take about the same time
    const valid = await verifyPassword(password, found?.passwordHash ?? DUMMY_HASH);
    if (!found || !valid) {
      this.logger.info('password_sign_in_failed');
      throw new UnauthorizedException({
        error: 'INVALID_CREDENTIALS',
        message: 'Wrong username or password.',
      });
    }
    this.logger.info({ userId: found.id }, 'user_signed_in');
    return { id: found.id, email: found.email, name: found.name, username: found.username };
  }
}
