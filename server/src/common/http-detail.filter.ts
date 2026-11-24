import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { FastifyReply } from 'fastify'

@Catch()
export class HttpDetailExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const reply = ctx.getResponse<FastifyReply>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const response = exception.getResponse()
      const detail =
        typeof response === 'object' && response !== null && 'detail' in response
          ? String((response as { detail: unknown }).detail)
          : typeof response === 'string'
            ? response
            : exception.message
      reply.status(status).send({ detail })
      return
    }

    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      detail: 'Internal Server Error',
    })
  }
}