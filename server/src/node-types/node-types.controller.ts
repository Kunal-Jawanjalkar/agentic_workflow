import { Controller, Get } from '@nestjs/common'

import { NodeTypesService } from './node-types.service'

@Controller('api/v1/node-types')
export class NodeTypesController {
  constructor(private readonly nodeTypesService: NodeTypesService) {}

  @Get()
  list() {
    return this.nodeTypesService.list()
  }
}