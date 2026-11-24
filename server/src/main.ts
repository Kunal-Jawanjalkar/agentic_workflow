import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import fastifyCookie from '@fastify/cookie'

import { AppModule } from './app.module'
import { HttpDetailException } from './common/http-detail.exception'
import { HttpDetailExceptionFilter } from './common/http-detail.filter'
import { EnvironmentVariables, corsOriginList } from './config/env'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  const config = app.get(ConfigService<EnvironmentVariables, true>)
  const origins = corsOriginList(config.get('CORS_ORIGINS', { infer: true }))

  await app.register(fastifyCookie)

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      exceptionFactory: (errors) => {
        const first = errors[0]?.constraints
        const message =
          first != null ? Object.values(first)[0] : 'Request validation failed'
        return new HttpDetailException(HttpStatus.UNPROCESSABLE_ENTITY, String(message))
      },
    }),
  )
  app.useGlobalFilters(new HttpDetailExceptionFilter())

  const port = config.get('PORT', { infer: true })
  await app.listen(port, '0.0.0.0')
}

void bootstrap()