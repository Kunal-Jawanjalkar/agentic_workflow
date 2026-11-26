import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage } from '@langchain/core/messages'

import { HttpDetailException } from '../common/http-detail.exception'
import { CredentialsService } from '../credentials/credentials.service'

import { interpolatePrompt, LlmNodeExecutor } from './llm-node'
import { NodeExecutionContext } from './node.types'

class TestableLlmNodeExecutor extends LlmNodeExecutor {
  mockModel!: BaseChatModel
  lastProvider?: string
  lastModelName?: string
  lastApiKey?: string

  protected override createChatModel(
    provider: string,
    model: string,
    apiKey: string,
  ): BaseChatModel {
    this.lastProvider = provider
    this.lastModelName = model
    this.lastApiKey = apiKey
    return this.mockModel
  }
}

describe('LlmNodeExecutor', () => {
  const credentialsService = {
    getSecretWithProviderForOwner: jest.fn(),
  }

  let executor: TestableLlmNodeExecutor

  const baseCtx: NodeExecutionContext = {
    ownerId: 'user-1',
    workflowId: 'wf-1',
    executionId: 'run-1',
    nodeId: 'llm-1',
    input: {
      trigger: { body: { text: 'My invoice is wrong' } },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    executor = new TestableLlmNodeExecutor(
      credentialsService as unknown as CredentialsService,
    )
  })

  it('interpolates template variables from upstream node input', () => {
    expect(
      interpolatePrompt('Classify: {{ trigger.body.text }} (missing: {{ none }})', baseCtx.input),
    ).toBe('Classify: My invoice is wrong (missing: )')
  })

  it('validates config and requires a model', () => {
    expect(() => executor.validateConfig({})).toThrow(HttpDetailException)
    expect(
      executor.validateConfig({
        credential_label: 'OpenAI Main',
        model: 'gpt-4o-mini',
        prompt: 'Hi',
      }),
    ).toEqual({
      credential_label: 'OpenAI Main',
      model: 'gpt-4o-mini',
      prompt: 'Hi',
      structured_output: false,
    })
  })

  it('fetches credentials from CredentialsService and executes via LangGraph', async () => {
    credentialsService.getSecretWithProviderForOwner.mockResolvedValue({
      id: 'cred-1',
      name: 'OpenAI Main',
      provider: 'openai',
      secret: { apiKey: 'sk-test-secret' },
    })

    const invokeMock = jest.fn().mockResolvedValue(new AIMessage('Billing issue'))
    executor.mockModel = { invoke: invokeMock } as unknown as BaseChatModel

    const result = await executor.execute(
      {
        credential_label: 'OpenAI Main',
        model: 'gpt-4o-mini',
        prompt: 'Classify: {{ trigger.body.text }}',
        structured_output: false,
      },
      baseCtx,
    )

    expect(credentialsService.getSecretWithProviderForOwner).toHaveBeenCalledWith(
      'user-1',
      'OpenAI Main',
    )
    expect(executor.lastProvider).toBe('openai')
    expect(executor.lastModelName).toBe('gpt-4o-mini')
    expect(executor.lastApiKey).toBe('sk-test-secret')
    expect(invokeMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      output: {
        text: 'Billing issue',
        model: 'gpt-4o-mini',
        provider: 'openai',
        structured_output: false,
      },
      outputHandle: 'default',
      status: 'completed',
    })
  })

  it('parses JSON when structured_output is enabled', async () => {
    credentialsService.getSecretWithProviderForOwner.mockResolvedValue({
      id: 'cred-2',
      name: 'Gemini Key',
      provider: 'gemini',
      secret: { api_key: 'gemini-secret' },
    })

    const invokeMock = jest
      .fn()
      .mockResolvedValue(new AIMessage('```json\n{"category":"billing","urgent":true}\n```'))
    executor.mockModel = { invoke: invokeMock } as unknown as BaseChatModel

    const result = await executor.execute(
      {
        credential_label: 'Gemini Key',
        model: 'gemini-2.5-flash',
        prompt: 'Return JSON for {{ trigger.body.text }}',
        structured_output: true,
      },
      baseCtx,
    )

    expect(result.output).toMatchObject({
      parsed: { category: 'billing', urgent: true },
      model: 'gemini-2.5-flash',
      provider: 'gemini',
      structured_output: true,
    })
  })

  it('throws when credential_label is missing', async () => {
    await expect(
      executor.execute(
        {
          credential_label: '',
          model: 'gpt-4o-mini',
          prompt: 'Hello',
          structured_output: false,
        },
        baseCtx,
      ),
    ).rejects.toThrow(HttpDetailException)
  })
})
