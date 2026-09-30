import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ListMissionsQueryDto,
  MissionListSort,
} from './list-missions-query.dto';

describe('ListMissionsQueryDto', () => {
  it('accepts an empty query', async () => {
    const dto = plainToInstance(ListMissionsQueryDto, {});
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts a valid mission status enum member', async () => {
    const dto = plainToInstance(ListMissionsQueryDto, {
      status: 'OPEN',
      sort: MissionListSort.NEWEST,
      limit: 10,
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an unknown status instead of leaking a raw Prisma error', async () => {
    const dto = plainToInstance(ListMissionsQueryDto, { status: 'BOGUS' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('status');
  });

  it('rejects a lowercase status (enum members are uppercase)', async () => {
    const dto = plainToInstance(ListMissionsQueryDto, { status: 'open' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
  });

  it('rejects an unknown sort direction', async () => {
    const dto = plainToInstance(ListMissionsQueryDto, { sort: 'sideways' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
  });

  it('rejects a limit outside the 1-100 range', async () => {
    const dtoZero = plainToInstance(ListMissionsQueryDto, { limit: 0 });
    const dtoHuge = plainToInstance(ListMissionsQueryDto, { limit: 101 });

    expect(await validate(dtoZero)).toHaveLength(1);
    expect(await validate(dtoHuge)).toHaveLength(1);
  });

  it('coerces a numeric string limit', async () => {
    const dto = plainToInstance(ListMissionsQueryDto, { limit: '25' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
