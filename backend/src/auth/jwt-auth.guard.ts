import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isDemoMode } from '../demo/demo.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ isDemoRequest?: boolean }>();

    if (isDemoMode() && request.isDemoRequest) {
      return true;
    }

    return super.canActivate(context);
  }
}
