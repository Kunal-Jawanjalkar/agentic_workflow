import { Test, TestingModule } from '@nestjs/testing'

import { CookieAuthGuard } from '../auth/cookie-auth.guard'

import { CredentialsController } from './credentials.controller'
import { CredentialsService } from './credentials.service'

describe('CredentialsController', () => {
  let controller: CredentialsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialsController],
      providers: [{ provide: CredentialsService, useValue: {} }],
    })
      .overrideGuard(CookieAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile()

    controller = module.get<CredentialsController>(CredentialsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
