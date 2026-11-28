import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { AuthModule } from './auth/auth.module'
import { AppConfigModule } from './config/config.module'
import { EnvironmentVariables } from './config/env'
import { CredentialsModule } from './credentials/credentials.module'
import { EngineModule } from './engine/engine.module'
import { NodeTypesModule } from './node-types/node-types.module'
import { NodesModule } from './nodes/nodes.module'
import { PrismaModule } from './prisma/prisma.module'
import { RunsModule } from './runs/runs.module'
import { WorkflowsModule } from './workflows/workflows.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    AppConfigModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => {
        const password = config.get('REDIS_PASSWORD', { infer: true })
        return {
          connection: {
            host: config.get('REDIS_HOST', { infer: true }),
            port: config.get('REDIS_PORT', { infer: true }),
            ...(password ? { password } : {}),
            maxRetriesPerRequest: null,
          },
        }
      },
    }),
    PrismaModule,
    AuthModule,
    NodesModule,
    NodeTypesModule,
    EngineModule,
    WorkflowsModule,
    RunsModule,
    CredentialsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
