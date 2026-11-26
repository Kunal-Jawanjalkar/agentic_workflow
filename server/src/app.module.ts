import { Module } from '@nestjs/common'

import { AuthModule } from './auth/auth.module'
import { AppConfigModule } from './config/config.module'
import { EngineModule } from './engine/engine.module'
import { NodeTypesModule } from './node-types/node-types.module'
import { NodesModule } from './nodes/nodes.module'
import { PrismaModule } from './prisma/prisma.module'
import { RunsModule } from './runs/runs.module'
import { WorkflowsModule } from './workflows/workflows.module'
import { AppController } from './app.controller'
import { CredentialsModule } from './credentials/credentials.module'

@Module({
  imports: [
    AppConfigModule,
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