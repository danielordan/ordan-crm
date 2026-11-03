import { Controller, Get } from '@nestjs/common';

// Internal endpoint used to verify the frontend proxy in Milestone 1. Remove in Milestone 2.
@Controller('ping')
export class PingController {
  @Get()
  ping(): { status: string } {
    return { status: 'ok' };
  }
}
