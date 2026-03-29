import { Controller } from '@nestjs/common';
import { MissionsService } from './missions.service.js';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}
}
