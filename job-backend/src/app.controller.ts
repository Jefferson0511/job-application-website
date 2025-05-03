import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()  // This is correct usage of @Get() without any parameters
  getHello(): string {
    return this.appService.getHello();
  }
}
