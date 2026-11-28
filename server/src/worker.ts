import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

async function bootstrapWorker(): Promise<void> {
  process.env.WORKER_ENABLED = 'true'
  const app = await NestFactory.createApplicationContext(AppModule)
  app.enableShutdownHooks()
  const logger = new Logger('WorkerBootstrap')
  logger.log('BullMQ workflow worker started')
}

void bootstrapWorker()
