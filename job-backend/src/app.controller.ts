import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Liveness probe. Public because the Docker HEALTHCHECK and any platform
   * health check call it without credentials.
   */
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
