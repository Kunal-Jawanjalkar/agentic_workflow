import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { Prisma } from '../generated/prisma/client'

import { HttpDetailException } from '../common/http-detail.exception'
import { EnvironmentVariables } from '../config/env'
import { PrismaService } from '../prisma/prisma.service'

import { CreateCredentialDto, UpdateCredentialDto } from './credentials.dto'

const ENCRYPTION_KEY_VERSION = 1
const NONCE_LENGTH = 12
const AUTH_TAG_LENGTH = 16

const PUBLIC_CREDENTIAL_SELECT = {
  id: true,
  name: true,
  provider: true,
  created_at: true,
} satisfies Prisma.CredentialSelect

@Injectable()
export class CredentialsService {
  private readonly encryptionKey: Buffer

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    const encryptionKey = config.get<string>('CREDENTIALS_ENCRYPTION_KEY')
    if (encryptionKey == null) {
      throw new Error('CREDENTIALS_ENCRYPTION_KEY is required')
    }
    this.encryptionKey = Buffer.from(encryptionKey, 'hex')
  }

  async listForOwner(ownerId: string) {
    const credentials = await this.prisma.credential.findMany({
      where: { owner_id: ownerId },
      orderBy: { created_at: 'desc' },
      select: PUBLIC_CREDENTIAL_SELECT,
    })
    return { credentials: credentials.map((credential) => this.publicCredential(credential)) }
  }

  async getForOwner(ownerId: string, credentialId: string) {
    const credential = await this.prisma.credential.findFirst({
      where: { id: credentialId, owner_id: ownerId },
      select: PUBLIC_CREDENTIAL_SELECT,
    })
    if (credential == null) {
      throw new HttpDetailException(404, 'Credential not found')
    }
    return this.publicCredential(credential)
  }

  async createForOwner(ownerId: string, body: CreateCredentialDto) {
    try {
      const credential = await this.prisma.credential.create({
        data: {
          owner_id: ownerId,
          name: body.name,
          provider: body.provider,
          encrypted_blob: this.encrypt(body.secret),
          key_version: ENCRYPTION_KEY_VERSION,
        },
        select: PUBLIC_CREDENTIAL_SELECT,
      })
      return this.publicCredential(credential)
    } catch (error) {
      this.throwIfCredentialNameConflict(error)
      throw error
    }
  }

  async updateForOwner(ownerId: string, credentialId: string, body: UpdateCredentialDto) {
    if (body.name === undefined && body.provider === undefined && body.secret === undefined) {
      throw new HttpDetailException(400, 'At least one credential field must be provided')
    }

    try {
      const result = await this.prisma.credential.updateMany({
        where: { id: credentialId, owner_id: ownerId },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.provider !== undefined ? { provider: body.provider } : {}),
          ...(body.secret !== undefined ? { encrypted_blob: this.encrypt(body.secret) } : {}),
        },
      })
      if (result.count === 0) {
        throw new HttpDetailException(404, 'Credential not found')
      }
      return this.getForOwner(ownerId, credentialId)
    } catch (error) {
      this.throwIfCredentialNameConflict(error)
      throw error
    }
  }

  async deleteForOwner(ownerId: string, credentialId: string): Promise<void> {
    const result = await this.prisma.credential.deleteMany({
      where: { id: credentialId, owner_id: ownerId },
    })
    if (result.count === 0) {
      throw new HttpDetailException(404, 'Credential not found')
    }
  }

  async getSecretForOwner(
    ownerId: string,
    credentialId: string,
  ): Promise<Record<string, unknown>> {
    const credential = await this.prisma.credential.findFirst({
      where: { id: credentialId, owner_id: ownerId },
      select: { encrypted_blob: true, key_version: true },
    })
    if (credential == null) {
      throw new HttpDetailException(404, 'Credential not found')
    }
    if (credential.key_version !== ENCRYPTION_KEY_VERSION) {
      throw new HttpDetailException(500, 'Credential uses an unsupported encryption key version')
    }
    return this.decrypt(credential.encrypted_blob)
  }

  async getSecretWithProviderForOwner(
    ownerId: string,
    credentialRef: string,
  ): Promise<{ id: string; name: string; provider: string; secret: Record<string, unknown> }> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        credentialRef,
      )
    const credential = await this.prisma.credential.findFirst({
      where: isUuid
        ? { id: credentialRef, owner_id: ownerId }
        : { owner_id: ownerId, name: credentialRef },
      select: { id: true, name: true, provider: true, encrypted_blob: true, key_version: true },
    })
    if (credential == null) {
      throw new HttpDetailException(404, `Credential "${credentialRef}" not found`)
    }
    if (credential.key_version !== ENCRYPTION_KEY_VERSION) {
      throw new HttpDetailException(500, 'Credential uses an unsupported encryption key version')
    }
    return {
      id: credential.id,
      name: credential.name,
      provider: credential.provider,
      secret: this.decrypt(credential.encrypted_blob),
    }
  }

  private publicCredential(credential: {
    id: string
    name: string
    provider: string
    created_at: Date
  }) {
    return {
      id: credential.id,
      name: credential.name,
      provider: credential.provider,
      created_at: credential.created_at.toISOString(),
    }
  }

  private encrypt(secret: Record<string, unknown>): Uint8Array<ArrayBuffer> {
    const nonce = randomBytes(NONCE_LENGTH)
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, nonce)
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(secret), 'utf8'),
      cipher.final(),
    ])
    const authTag = cipher.getAuthTag()
    const encryptedBlob: Uint8Array<ArrayBuffer> = new Uint8Array(
      new ArrayBuffer(nonce.length + authTag.length + ciphertext.length),
    )
    encryptedBlob.set(nonce)
    encryptedBlob.set(authTag, nonce.length)
    encryptedBlob.set(ciphertext, nonce.length + authTag.length)
    return encryptedBlob
  }

  private decrypt(encryptedBlob: Uint8Array): Record<string, unknown> {
    const blob = Buffer.from(encryptedBlob)
    if (blob.length < NONCE_LENGTH + AUTH_TAG_LENGTH) {
      throw new HttpDetailException(500, 'Credential could not be decrypted')
    }

    try {
      const nonce = blob.subarray(0, NONCE_LENGTH)
      const authTag = blob.subarray(NONCE_LENGTH, NONCE_LENGTH + AUTH_TAG_LENGTH)
      const ciphertext = blob.subarray(NONCE_LENGTH + AUTH_TAG_LENGTH)
      const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, nonce)
      decipher.setAuthTag(authTag)
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
        'utf8',
      )
      const secret: unknown = JSON.parse(plaintext)
      if (secret == null || typeof secret !== 'object' || Array.isArray(secret)) {
        throw new Error('Stored credential is not an object')
      }
      return secret as Record<string, unknown>
    } catch {
      throw new HttpDetailException(500, 'Credential could not be decrypted')
    }
  }

  private throwIfCredentialNameConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new HttpDetailException(409, 'A credential with this name already exists')
    }
  }
}
