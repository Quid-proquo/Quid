import { MissionSearchService } from './mission-search.service';
import { MissionSearchSort } from './search-missions-query.dto';

describe('MissionSearchService.buildQuery', () => {
  const svc = new MissionSearchService({} as never);

  it('parameterises q instead of concatenating it', () => {
    const evil = "'; DROP TABLE missions; --";
    const sql = svc.buildQuery({ q: evil });
    expect(sql.sql).not.toContain('DROP TABLE');
    expect(sql.values).toContain(evil);
    expect(sql.sql).toContain('ts_rank_cd');
  });

  it('applies filters and reward sort without full-text ranking', () => {
    const sql = svc.buildQuery({
      token: 'USDC',
      minReward: '10',
      sort: MissionSearchSort.REWARD,
    });
    expect(sql.sql).toContain('"reward_token" =');
    expect(sql.sql).not.toContain('ts_rank_cd');
    expect(sql.values).toEqual(expect.arrayContaining(['USDC', '10']));
  });
});
