export const DEMO_MODE_ENV = 'DEMO_MODE';
export const DEMO_ADDRESS_ENV = 'DEMO_ADDRESS';

export const DEFAULT_DEMO_ADDRESS =
  'GDEMOADDRESS0000000000000000000000000000000000000000000000';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

export const DEMO_READ_ONLY_CODE = 'DEMO_READ_ONLY';

export function isDemoMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[DEMO_MODE_ENV]?.toLowerCase() === 'true';
}

export function getDemoAddress(env: NodeJS.ProcessEnv = process.env): string {
  return env[DEMO_ADDRESS_ENV] || DEFAULT_DEMO_ADDRESS;
}
