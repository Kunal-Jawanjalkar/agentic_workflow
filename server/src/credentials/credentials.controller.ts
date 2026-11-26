import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'

import { CookieAuthGuard } from '../auth/cookie-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { UserPublicDto } from '../auth/auth.types'

import { CreateCredentialDto, UpdateCredentialDto } from './credentials.dto'
import { CredentialsService } from './credentials.service'

@Controller('api/v1/credentials')
@UseGuards(CookieAuthGuard)
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get()
  list(@CurrentUser() user: UserPublicDto) {
    return this.credentialsService.listForOwner(user.id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPublicDto, @Body() body: CreateCredentialDto) {
    return this.credentialsService.createForOwner(user.id, body)
  }

  @Get(':credentialId')
  get(
    @CurrentUser() user: UserPublicDto,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
  ) {
    return this.credentialsService.getForOwner(user.id, credentialId)
  }

  @Patch(':credentialId')
  update(
    @CurrentUser() user: UserPublicDto,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
    @Body() body: UpdateCredentialDto,
  ) {
    return this.credentialsService.updateForOwner(user.id, credentialId, body)
  }

  @Delete(':credentialId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentUser() user: UserPublicDto,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
  ) {
    return this.credentialsService.deleteForOwner(user.id, credentialId)
  }
}
