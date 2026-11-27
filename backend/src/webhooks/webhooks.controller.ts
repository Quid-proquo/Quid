import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks/subscriptions')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.webhooks.create(req.user.address, body);
  }

  @Get()
  list(@Req() req: any) {
    return this.webhooks.list(req.user.address);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.webhooks.update(req.user.address, id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.webhooks.remove(req.user.address, id);
  }

  @Post(':id/rotate-secret')
  rotate(@Req() req: any, @Param('id') id: string) {
    return this.webhooks.rotateSecret(req.user.address, id);
  }
}
