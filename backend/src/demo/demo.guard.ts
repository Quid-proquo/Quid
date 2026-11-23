import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  DEMO_READ_ONLY_CODE,
  DEMO_USER_ID,
  getDemoAddress,
  isDemoMode,
} from './demo.constants';

interface DemoRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  isDemoRequest?: boolean;
  user?: { userId: string; address: string };
}

@Injectable()
export class DemoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!isDemoMode()) return true;

    const request = context.switchToHttp().getRequest<DemoRequest>();
    const method = (request.method ?? 'GET').toUpperCase();

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      throw new ForbiddenException({
        code: DEMO_READ_ONLY_CODE,
        message:
          'Demo mode is read-only. Start the API without DEMO_MODE=true to write.',
      });
    }

    if (!request.headers?.authorization) {
      request.isDemoRequest = true;
      request.user = { userId: DEMO_USER_ID, address: getDemoAddress() };
    }

    return true;
  }
}
