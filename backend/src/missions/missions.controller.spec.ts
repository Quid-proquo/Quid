import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import {
  ListMissionsQueryDto,
  MissionListSort,
  MissionQueryStatus,
} from './dto/list-missions-query.dto';

describe('MissionsController', () => {
  let controller: MissionsController;
  let missionsService: { listPublicMissions: jest.Mock };

  beforeEach(() => {
    missionsService = {
      listPublicMissions: jest.fn(),
    };

    controller = new MissionsController(
      missionsService as unknown as MissionsService,
    );
  });

  it('forwards the public list query to the service unchanged', async () => {
    const query: ListMissionsQueryDto = {
      status: MissionQueryStatus.OPEN,
      sort: MissionListSort.NEWEST,
      limit: 12,
    };

    missionsService.listPublicMissions.mockResolvedValue(['mission']);

    await expect(controller.list(query)).resolves.toEqual(['mission']);
    expect(missionsService.listPublicMissions).toHaveBeenCalledWith(query);
  });
});
