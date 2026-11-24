import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  readRoot(): { message: string } {
    return { message: 'Hello, World' }
  }

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' }
  }
}