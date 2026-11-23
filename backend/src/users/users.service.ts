import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NO_ACTOR, type Actor } from '../common/request-actor';
import type { GoogleSignInDto } from './dto/google-sign-in.dto';
import type { PasswordCredentialsDto } from './dto/password-credentials.dto';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password-hash';
import { UsersRepository, type UserRecord } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly users: UsersRepository,
    private readonly activity: ActivityLogService,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async signInWithGoogle(dto: GoogleSignInDto, actor: Actor = NO_ACTOR): Promise<UserRecord> {
    const user = await this.users.upsertByGoogleId(dto);
    // Only the internal ID is logged, never email, name or username
    this.logger.info({ userId: user.id }, 'user_signed_in');
    await this.activity.record({
      action: 'user_signed_in',
      result: 'success',
      actor,
      userId: user.id,
      details: { method: 'google' },
    });
    return user;
  }

  async register(
    { username, password }: PasswordCredentialsDto,
    actor: Actor = NO_ACTOR,
  ): Promise<UserRecord> {
    const user = await this.users.createWithPassword(username, await hashPassword(password));
    if (!user) {
      throw new ConflictException({
        error: 'USERNAME_TAKEN',
        message: 'This username is already taken.',
      });
    }
    this.logger.info({ userId: user.id }, 'user_registered');
    await this.activity.record({
      action: 'user_registered',
      result: 'success',
      actor,
      userId: user.id,
      details: { method: 'password' },
    });
    return user;
  }

  async signInWithPassword(
    { username, password }: PasswordCredentialsDto,
    actor: Actor = NO_ACTOR,
  ): Promise<UserRecord> {
    const found = await this.users.findByUsername(username);
    // A missing user still runs a hash check, so both failures take about the same time
    const valid = await verifyPassword(password, found?.passwordHash ?? DUMMY_HASH);
    if (!found || !valid) {
      this.logger.info('password_sign_in_failed');
      // The account owner when the username exists; the username itself is never stored
      await this.activity.record({
        action: 'password_sign_in_failed',
        result: 'failure',
        actor,
        userId: found?.id ?? null,
        details: { method: 'password' },
      });
      throw new UnauthorizedException({
        error: 'INVALID_CREDENTIALS',
        message: 'Wrong username or password.',
      });
    }
    this.logger.info({ userId: found.id }, 'user_signed_in');
    await this.activity.record({
      action: 'user_signed_in',
      result: 'success',
      actor,
      userId: found.id,
      details: { method: 'password' },
    });
    return { id: found.id, email: found.email, name: found.name, username: found.username };
  }
}
