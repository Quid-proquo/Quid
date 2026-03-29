import { Controller, Get, Query } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { ListMissionsQueryDto } from './dto/list-missions-query.dto';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  list(@Query() query: ListMissionsQueryDto): Promise<unknown> {
    return this.missionsService.listPublicMissions(query);
  }
}
