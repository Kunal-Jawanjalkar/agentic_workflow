import { HttpDetailException } from '../common/http-detail.exception'

import { NodeExecutionContext } from './node.types'
import { TRIGGER_TYPES, TriggerNodeExecutor } from './trigger-node'

describe('TriggerNodeExecutor', () => {
  let executor: TriggerNodeExecutor

  const baseContext: NodeExecutionContext = {
    ownerId: 'user-1',
    workflowId: 'wf-1',
    executionId: 'run-1',
    nodeId: 'trigger-1',
    input: {},
  }

  beforeEach(() => {
    executor = new TriggerNodeExecutor()
  })

  it('exposes the trigger descriptor with manual, webhook, and scheduler options', () => {
    expect(executor.descriptor).toMatchObject({
      type: 'trigger',
      version: 1,
      category: 'trigger',
      outputs: ['default'],
    })
    const properties = executor.descriptor.config_schema.properties as Record<
      string,
      { enum?: string[]; default?: string }
    >
    expect(properties.trigger_type?.enum).toEqual(['manual', 'webhook', 'scheduler'])
    expect(properties.trigger_type?.default).toBe('manual')
    expect(TRIGGER_TYPES).toEqual(['manual', 'webhook', 'scheduler'])
  })

  it('validates config and defaults trigger_type to manual', () => {
    expect(executor.validateConfig(undefined)).toEqual({ trigger_type: 'manual' })
    expect(executor.validateConfig({})).toEqual({ trigger_type: 'manual' })
    expect(
      executor.validateConfig({
        trigger_type: 'scheduler',
        cron: '0 * * * *',
        timezone: 'UTC',
      }),
    ).toEqual({
      trigger_type: 'scheduler',
      cron: '0 * * * *',
      timezone: 'UTC',
    })
  })

  it('rejects invalid trigger config', () => {
    expect(() => executor.validateConfig('manual')).toThrow(HttpDetailException)
    expect(() => executor.validateConfig({ trigger_type: 'email' })).toThrow(HttpDetailException)
    expect(() =>
      executor.validateConfig({ trigger_type: 'scheduler', cron: '   ' }),
    ).toThrow(HttpDetailException)
  })

  it('executes a manual trigger', async () => {
    const result = await executor.execute(
      { trigger_type: 'manual' },
      { ...baseContext, input: { ticketId: 'T-42' } },
    )

    expect(result.status).toBe('completed')
    expect(result.outputHandle).toBe('default')
    expect(result.output).toMatchObject({
      trigger_type: 'manual',
      ticketId: 'T-42',
    })
    expect(typeof result.output.triggered_at).toBe('string')
  })

  it('executes a webhook trigger and normalizes HTTP request fields', async () => {
    const result = await executor.execute(
      { trigger_type: 'webhook', webhook_method: 'POST' },
      {
        ...baseContext,
        input: {
          body: { text: 'Need help' },
          headers: { 'x-source': 'app' },
        },
      },
    )

    expect(result.status).toBe('completed')
    expect(result.outputHandle).toBe('default')
    expect(result.output).toMatchObject({
      trigger_type: 'webhook',
      method: 'POST',
      headers: { 'x-source': 'app' },
      query: {},
      body: { text: 'Need help' },
    })
  })

  it('executes a scheduler trigger with cron metadata', async () => {
    const result = await executor.execute(
      { trigger_type: 'scheduler', cron: '*/5 * * * *', timezone: 'Asia/Kolkata' },
      { ...baseContext, input: { scheduled_at: '2026-11-26T17:00:00.000Z' } },
    )

    expect(result.status).toBe('completed')
    expect(result.outputHandle).toBe('default')
    expect(result.output).toMatchObject({
      trigger_type: 'scheduler',
      cron: '*/5 * * * *',
      timezone: 'Asia/Kolkata',
      scheduled_at: '2026-11-26T17:00:00.000Z',
    })
  })
})
