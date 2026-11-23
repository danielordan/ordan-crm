import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RequestActor, type Actor } from '../common/request-actor';
import { parseOrBadRequest } from '../common/validation/parse';
import { googleSignInSchema } from './dto/google-sign-in.dto';
import { passwordSignInSchema, registerSchema } from './dto/password-credentials.dto';
import type { UserRecord } from './users.repository';
import { UsersService } from './users.service';

// Called only by the Next.js server during sign-in and sign-up; not proxied to the browser
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post('google-sign-in')
  @HttpCode(200)
  signInWithGoogle(@Body() body: unknown, @RequestActor() actor: Actor): Promise<UserRecord> {
    return this.users.signInWithGoogle(parseOrBadRequest(googleSignInSchema, body), actor);
  }

  @Post('register')
  @HttpCode(201)
  register(@Body() body: unknown, @RequestActor() actor: Actor): Promise<UserRecord> {
    return this.users.register(parseOrBadRequest(registerSchema, body), actor);
  }

  @Post('password-sign-in')
  @HttpCode(200)
  signInWithPassword(@Body() body: unknown, @RequestActor() actor: Actor): Promise<UserRecord> {
    return this.users.signInWithPassword(parseOrBadRequest(passwordSignInSchema, body), actor);
  }
}
