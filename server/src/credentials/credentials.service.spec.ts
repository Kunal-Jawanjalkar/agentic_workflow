import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '../prisma/prisma.service'

import { CredentialsService } from './credentials.service'

describe('CredentialsService', () => {
  let service: CredentialsService
  const encryptionKey = 'a'.repeat(64)
  const metadata = {
    id: 'credential-id',
    name: 'Example',
    provider: 'example',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
  }
  const prisma = {
    credential: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: () => encryptionKey } },
      ],
    })
      .compile()

    service = module.get<CredentialsService>(CredentialsService)
  })

  it('stores the secret encrypted and returns only credential metadata', async () => {
    prisma.credential.create.mockResolvedValue(metadata)

    const result = await service.createForOwner('owner-id', {
      name: 'Example',
      provider: 'example',
      secret: { apiKey: 'sensitive-value' },
    })

    const createData = prisma.credential.create.mock.calls[0][0].data
    expect(createData.encrypted_blob).toBeInstanceOf(Uint8Array)
    expect(Buffer.from(createData.encrypted_blob).toString()).not.toContain('sensitive-value')
    expect(createData.key_version).toBe(1)
    expect(result).toEqual({
      id: metadata.id,
      name: metadata.name,
      provider: metadata.provider,
      created_at: metadata.created_at.toISOString(),
    })
  })

  it('decrypts a stored secret only for its owner', async () => {
    prisma.credential.create.mockResolvedValue(metadata)
    await service.createForOwner('owner-id', {
      name: 'Example',
      provider: 'example',
      secret: { apiKey: 'sensitive-value' },
    })
    const encryptedBlob = prisma.credential.create.mock.calls[0][0].data.encrypted_blob
    prisma.credential.findFirst.mockResolvedValue({
      encrypted_blob: encryptedBlob,
      key_version: 1,
    })

    await expect(service.getSecretForOwner('owner-id', metadata.id)).resolves.toEqual({
      apiKey: 'sensitive-value',
    })
    expect(prisma.credential.findFirst).toHaveBeenCalledWith({
      where: { id: metadata.id, owner_id: 'owner-id' },
      select: { encrypted_blob: true, key_version: true },
    })
  })
})
