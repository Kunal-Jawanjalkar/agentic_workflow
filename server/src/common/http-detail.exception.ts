import { HttpException, HttpStatus } from '@nestjs/common'

export class HttpDetailException extends HttpException {
  constructor(status: HttpStatus, detail: string) {
    super({ detail }, status)
  }
}