import { HttpStatus, Injectable } from '@nestjs/common'

import { HttpDetailException } from '../common/http-detail.exception'

import {
  NodeExecutionContext,
  NodeExecutionResult,
  NodeExecutor,
  NodeTypeDescriptor,
} from './node.types'

export const TRIGGER_TYPES = ['manual', 'webhook', 'scheduler'] as const
export type TriggerType = (typeof TRIGGER_TYPES)[number]

export interface TriggerNodeConfig {
  trigger_type: TriggerType
  cron?: string
  timezone?: string
  webhook_method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  webhook_secret?: string
  default_input?: Record<string, unknown>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTriggerType(value: unknown): value is TriggerType {
  return typeof value === 'string' && (TRIGGER_TYPES as readonly string[]).includes(value)
}

function optionalNonEmptyString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpDetailException(
      HttpStatus.BAD_REQUEST,
      `Trigger config "${fieldName}" must be a non-empty string`,
    )
  }
  return value.trim()
}

@Injectable()
export class TriggerNodeExecutor implements NodeExecutor<TriggerNodeConfig> {
  readonly descriptor: NodeTypeDescriptor = {
    type: 'trigger',
    version: 1,
    label: 'Trigger',
    category: 'trigger',
    icon: 'bolt',
    outputs: ['default'],
    config_schema: {
      properties: {
        trigger_type: {
          type: 'string',
          enum: [...TRIGGER_TYPES],
          default: 'manual',
        },
      },
    },
  }

  validateConfig(config: unknown): TriggerNodeConfig {
    if (config === undefined) {
      return { trigger_type: 'manual' }
    }
    if (!isPlainObject(config)) {
      throw new HttpDetailException(HttpStatus.BAD_REQUEST, 'Trigger config must be an object')
    }

    const rawType = config.trigger_type ?? 'manual'
    if (!isTriggerType(rawType)) {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        `Invalid trigger_type "${String(rawType)}". Expected one of: ${TRIGGER_TYPES.join(', ')}`,
      )
    }

    const validated: TriggerNodeConfig = { trigger_type: rawType }

    const cron = optionalNonEmptyString(config.cron, 'cron')
    if (cron !== undefined) {
      validated.cron = cron
    }

    const timezone = optionalNonEmptyString(config.timezone, 'timezone')
    if (timezone !== undefined) {
      validated.timezone = timezone
    }

    if (config.webhook_method !== undefined) {
      const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      if (
        typeof config.webhook_method !== 'string' ||
        !allowedMethods.includes(config.webhook_method)
      ) {
        throw new HttpDetailException(
          HttpStatus.BAD_REQUEST,
          `Invalid webhook_method "${String(config.webhook_method)}"`,
        )
      }
      validated.webhook_method = config.webhook_method as TriggerNodeConfig['webhook_method']
    }

    const webhookSecret = optionalNonEmptyString(config.webhook_secret, 'webhook_secret')
    if (webhookSecret !== undefined) {
      validated.webhook_secret = webhookSecret
    }

    if (config.default_input !== undefined) {
      if (!isPlainObject(config.default_input)) {
        throw new HttpDetailException(
          HttpStatus.BAD_REQUEST,
          'Trigger config "default_input" must be an object',
        )
      }
      validated.default_input = config.default_input
    }

    return validated
  }

  async execute(
    config: TriggerNodeConfig,
    ctx: NodeExecutionContext,
  ): Promise<NodeExecutionResult> {
    const validated = this.validateConfig(config)
    const triggeredAt = new Date().toISOString()
    const input = isPlainObject(ctx.input) ? ctx.input : {}

    switch (validated.trigger_type) {
      case 'manual':
        return {
          output: {
            ...(validated.default_input ?? {}),
            ...input,
            trigger_type: 'manual',
            triggered_at: triggeredAt,
          },
          outputHandle: 'default',
          status: 'completed',
        }

      case 'webhook':
        return {
          output: {
            ...input,
            method:
              typeof input.method === 'string'
                ? input.method
                : (validated.webhook_method ?? 'POST'),
            headers: isPlainObject(input.headers) ? input.headers : {},
            query: isPlainObject(input.query) ? input.query : {},
            body: 'body' in input ? input.body : null,
            trigger_type: 'webhook',
            triggered_at: triggeredAt,
          },
          outputHandle: 'default',
          status: 'completed',
        }

      case 'scheduler':
        return {
          output: {
            ...input,
            cron: typeof input.cron === 'string' ? input.cron : (validated.cron ?? null),
            timezone:
              typeof input.timezone === 'string'
                ? input.timezone
                : (validated.timezone ?? 'UTC'),
            scheduled_at:
              typeof input.scheduled_at === 'string' ? input.scheduled_at : triggeredAt,
            trigger_type: 'scheduler',
            triggered_at: triggeredAt,
          },
          outputHandle: 'default',
          status: 'completed',
        }
    }
  }
}
