import { Test } from '@nestjs/testing';
import { WebhooksModule } from './webhooks.module';

describe('WebhooksModule', () => {
  it('compiles on its own', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [WebhooksModule],
    })
      .useMocker(() => ({}))
      .compile();

    expect(moduleRef.get(WebhooksModule)).toBeInstanceOf(WebhooksModule);
  });
});
