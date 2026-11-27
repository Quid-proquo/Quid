import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { AppRole, ROLES_KEY } from './roles.decorator';

interface AuthedRequest {
  user?: { address?: string };
}

/**
 * Use after JwtAuthGuard. ADMIN is granted to addresses listed in the
 * ADMIN_ADDRESSES env var (comma separated); otherwise User.role is used.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<AppRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const address = context.switchToHttp().getRequest<AuthedRequest>().user
      ?.address;
    if (!address) throw new ForbiddenException('Missing authenticated user');

    const admins = (process.env.ADMIN_ADDRESSES ?? '')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    if (admins.includes(address) && required.includes('ADMIN')) return true;

    const user = await this.prisma.user.findUnique({ where: { address } });
    if (user && required.includes(user.role)) return true;

    throw new ForbiddenException('Insufficient role');
  }
}
