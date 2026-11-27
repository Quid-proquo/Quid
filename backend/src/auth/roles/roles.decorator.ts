import { SetMetadata } from '@nestjs/common';

export type AppRole = 'CREATOR' | 'EARNER' | 'ADMIN';

export const ROLES_KEY = 'quid:roles';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
export const Creator = () => Roles('CREATOR');
export const Hunter = () => Roles('EARNER');
export const Admin = () => Roles('ADMIN');
