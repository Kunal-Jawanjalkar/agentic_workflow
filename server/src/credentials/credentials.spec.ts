import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { CreateCredentialDto } from './credentials.dto'

describe('CreateCredentialDto', () => {
  it('accepts a secret object with credential metadata', async () => {
    const dto = plainToInstance(CreateCredentialDto, {
      name: 'Example',
      provider: 'example',
      secret: { apiKey: 'value' },
    })

    await expect(validate(dto)).resolves.toHaveLength(0)
  })

  it('rejects a non-object secret', async () => {
    const dto = plainToInstance(CreateCredentialDto, {
      name: 'Example',
      provider: 'example',
      secret: 'value',
    })

    expect(await validate(dto)).not.toHaveLength(0)
  })
})
