import { Module } from '@nestjs/common'

import { AuthModule } from './auth/auth.module'
import { AppConfigModule } from './config/config.module'
import { NodeTypesModule } from './node-types/node-types.module'
import { PrismaModule } from './prisma/prisma.module'
import { WorkflowsModule } from './workflows/workflows.module'
import { AppController } from './app.controller'

@Module({
  imports: [AppConfigModule, PrismaModule, AuthModule, NodeTypesModule, WorkflowsModule],
  controllers: [AppController],
})
export class AppModule {}