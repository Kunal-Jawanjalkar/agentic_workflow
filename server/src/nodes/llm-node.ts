import { ChatAnthropic } from '@langchain/anthropic'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { HttpStatus, Injectable } from '@nestjs/common'

import { HttpDetailException } from '../common/http-detail.exception'
import { CredentialsService } from '../credentials/credentials.service'

import {
  NodeExecutionContext,
  NodeExecutionResult,
  NodeExecutor,
  NodeTypeDescriptor,
} from './node.types'

export interface LlmNodeConfig {
  credential_label: string
  model: string
  prompt: string
  structured_output: boolean
}

const LlmGraphAnnotation = Annotation.Root({
  prompt: Annotation<string>(),
  structuredOutput: Annotation<boolean>(),
  text: Annotation<string>(),
  parsed: Annotation<unknown>(),
})

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function lookupPath(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.').map((part) => part.trim()).filter(Boolean)
  let current: unknown = source
  for (const part of parts) {
    if (!isPlainObject(current) || !(part in current)) {
      return undefined
    }
    current = current[part]
  }
  return current
}

export function interpolatePrompt(template: string, input: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawPath: string) => {
    const resolved = lookupPath(input, rawPath)
    if (resolved === undefined || resolved === null) {
      return ''
    }
    if (typeof resolved === 'object') {
      return JSON.stringify(resolved)
    }
    return String(resolved)
  })
}

function extractMessageText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }
        if (isPlainObject(part) && typeof part.text === 'string') {
          return part.text
        }
        return ''
      })
      .join('')
  }
  return content == null ? '' : String(content)
}

function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const candidate = fenced ? fenced[1] : trimmed
  return JSON.parse(candidate) as unknown
}

function extractApiKey(secret: Record<string, unknown>): string {
  const candidate = secret.apiKey ?? secret.api_key ?? secret.token
  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    throw new HttpDetailException(
      HttpStatus.BAD_REQUEST,
      'Selected credential does not contain an apiKey, api_key, or token',
    )
  }
  return candidate.trim()
}

@Injectable()
export class LlmNodeExecutor implements NodeExecutor<LlmNodeConfig> {
  readonly descriptor: NodeTypeDescriptor = {
    type: 'llm',
    version: 1,
    label: 'LLM',
    category: 'ai',
    icon: 'sparkles',
    outputs: ['default'],
    config_schema: {
      required: ['model'],
      properties: {
        credential_label: { type: 'string', default: '' },
        model: { type: 'string' },
        prompt: { type: 'string', default: '' },
        structured_output: { type: 'boolean', default: false },
      },
    },
  }

  constructor(private readonly credentialsService: CredentialsService) {}

  validateConfig(config: unknown): LlmNodeConfig {
    if (!isPlainObject(config)) {
      throw new HttpDetailException(HttpStatus.BAD_REQUEST, 'LLM config must be an object')
    }
    if (typeof config.model !== 'string' || config.model.trim().length === 0) {
      throw new HttpDetailException(HttpStatus.BAD_REQUEST, 'LLM config "model" is required')
    }

    const credentialLabel =
      typeof config.credential_label === 'string' ? config.credential_label.trim() : ''
    const prompt = typeof config.prompt === 'string' ? config.prompt : ''
    const structuredOutput = config.structured_output === true

    return {
      credential_label: credentialLabel,
      model: config.model.trim(),
      prompt,
      structured_output: structuredOutput,
    }
  }

  protected createChatModel(provider: string, model: string, apiKey: string): BaseChatModel {
    const normalized = provider.trim().toLowerCase()
    switch (normalized) {
      case 'openai':
        return new ChatOpenAI({ model, apiKey, maxRetries: 0 })
      case 'anthropic':
        return new ChatAnthropic({ model, apiKey, maxRetries: 0 })
      case 'google':
      case 'gemini':
      case 'google-genai':
      case 'google_genai':
        return new ChatGoogleGenerativeAI({ model, apiKey, maxRetries: 0 })
      default:
        throw new HttpDetailException(
          HttpStatus.BAD_REQUEST,
          `Unsupported LLM credential provider "${provider}"`,
        )
    }
  }

  async execute(config: LlmNodeConfig, ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
    const validated = this.validateConfig(config)
    if (!validated.credential_label) {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'LLM node requires a credential_label matching a saved credential',
      )
    }

    const credential = await this.credentialsService.getSecretWithProviderForOwner(
      ctx.ownerId,
      validated.credential_label,
    )
    const apiKey = extractApiKey(credential.secret)
    const chatModel = this.createChatModel(credential.provider, validated.model, apiKey)

    const input = isPlainObject(ctx.input) ? ctx.input : {}
    const renderedPrompt = interpolatePrompt(validated.prompt, input)

    const graph = new StateGraph(LlmGraphAnnotation)
      .addNode('invoke_model', async (state) => {
        const messages = state.structuredOutput
          ? [
              new SystemMessage(
                'Respond with valid JSON only, without markdown or extra commentary.',
              ),
              new HumanMessage(state.prompt),
            ]
          : [new HumanMessage(state.prompt)]

        const aiMessage = await chatModel.invoke(messages, {
          signal: AbortSignal.timeout(45_000),
        })
        const text = extractMessageText(aiMessage.content)
        let parsed: unknown = null
        if (state.structuredOutput) {
          try {
            parsed = parseJsonResponse(text)
          } catch {
            throw new HttpDetailException(
              HttpStatus.BAD_GATEWAY,
              'LLM did not return valid JSON for structured_output',
            )
          }
        }
        return { text, parsed }
      })
      .addEdge(START, 'invoke_model')
      .addEdge('invoke_model', END)
      .compile()

    const finalState = await graph.invoke({
      prompt: renderedPrompt,
      structuredOutput: validated.structured_output,
      text: '',
      parsed: null,
    })

    return {
      output: {
        text: finalState.text,
        ...(validated.structured_output ? { parsed: finalState.parsed } : {}),
        model: validated.model,
        provider: credential.provider,
        structured_output: validated.structured_output,
      },
      outputHandle: 'default',
      status: 'completed',
    }
  }
}
