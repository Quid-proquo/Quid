import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

type AnchorInfo = Record<string, unknown>;

@Injectable()
export class AnchorDiscoveryService {
  private readonly logger = new Logger(AnchorDiscoveryService.name);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshAll(): Promise<void> {
    const domains = this.getSeedDomains();
    for (const domain of domains) {
      await this.refreshDomain(domain);
    }
  }

  async list(filter: { country?: string; asset?: string }): Promise<Record<string, unknown>[]> {
    const anchors = (await (this.prisma as any).anchor.findMany({ where: { healthy: true } })) as Record<string, unknown>[];
    return anchors.filter((a) => {
      const countries = a.countries;
      const countryOk = !filter.country || (Array.isArray(countries) && countries.includes(filter.country));
      const assetOk = !filter.asset || this.hasAsset(a, filter.asset);
      return countryOk && assetOk;
    });
  }

  private hasAsset(anchor: Record<string, unknown>, asset: string): boolean {
    const assets = anchor.assets as Record<string, unknown> | unknown[] | undefined;
    const list: unknown[] = Array.isArray(assets)
      ? assets
      : Array.isArray((assets as Record<string, unknown> | undefined)?.currencies)
        ? ((assets as Record<string, unknown>).currencies as unknown[])
        : Array.isArray((assets as Record<string, unknown> | undefined)?.assets)
          ? ((assets as Record<string, unknown>).assets as unknown[])
          : [];
    return list.some((c) => {
      const item = c as Record<string, unknown> | undefined;
      return item?.code === asset || item?.asset === asset;
    });
  }

  getSeedDomains(): string[] {
    const raw = this.config.get<string>('ANCHOR_DOMAINS') ?? '';
    const parsed = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : ['testanchor.stellar.org'];
  }

  async refreshDomain(domain: string): Promise<void> {
    try {
      const toml = await this.fetchToml(domain);
      const transferServer = toml?.TRANSFER_SERVER_SEP0024 ?? toml?.TRANSFER_SERVER_SEP24;
      if (!transferServer || !this.isValidUrl(String(transferServer))) {
        throw new Error('missing TRANSFER_SERVER_SEP0024');
      }
      const info = await this.fetchSep24Info(String(transferServer));
      const currencies = Array.isArray(toml?.CURRENCIES) ? toml.CURRENCIES : [];
      await (this.prisma as any).anchor.upsert({
        where: { domain },
        create: {
          domain,
          name: typeof toml?.ORG_NAME === 'string' ? toml.ORG_NAME : domain,
          countries: this.extractCountries(currencies),
          assets: currencies,
          info: info as any,
          lastCheckedAt: new Date(),
          healthy: true,
        },
        update: {
          name: typeof toml?.ORG_NAME === 'string' ? toml.ORG_NAME : domain,
          countries: this.extractCountries(currencies),
          assets: currencies,
          info: info as any,
          lastCheckedAt: new Date(),
          healthy: true,
        },
      });
    } catch (error) {
      this.logger.warn(`Anchor ${domain} unhealthy: ${error instanceof Error ? error.message : String(error)}`);
      await (this.prisma as any).anchor.upsert({
        where: { domain },
        create: { domain, name: domain, countries: [], assets: [], info: {}, lastCheckedAt: new Date(), healthy: false },
        update: { lastCheckedAt: new Date(), healthy: false },
      });
    }
  }

  private extractCountries(currencies: any[]): string[] {
    const set = new Set<string>();
    for (const c of currencies) {
      const v = c?.country_codes ?? c?.countries;
      if (Array.isArray(v)) v.forEach((x) => typeof x === 'string' && set.add(x));
      if (typeof v === 'string') v.split(',').map((s) => s.trim()).filter(Boolean).forEach((x) => set.add(x));
    }
    return [...set];
  }

  async fetchToml(domain: string): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`https://${domain}/.well-known/stellar.toml`, { signal: controller.signal });
      if (!res.ok) throw new Error(`toml ${res.status}`);
      const text = await res.text();
      return this.parseToml(text);
    } finally {
      clearTimeout(timeout);
    }
  }

  parseToml(text: string): any {
    // Minimal TOML parsing for the fields we need; avoids adding deps.
    const result: any = {};
    const lines = text.split(/\r?\n/);
    let section = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) { section = trimmed.slice(2, -2).trim(); continue; }
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) { section = trimmed.slice(1, -1).trim(); continue; }
      const m = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/i);
      if (!m) continue;
      const key = m[1].toUpperCase();
      let value: any = m[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (section.toUpperCase() === 'CURRENCIES') {
        result.CURRENCIES = result.CURRENCIES ?? [];
        let last = result.CURRENCIES[result.CURRENCIES.length - 1];
        if (!last || last.__closed) { last = {}; result.CURRENCIES.push(last); }
        last[key.toLowerCase()] = value;
      } else if (!section) {
        result[key] = value;
      }
    }
    return result;
  }

  async fetchSep24Info(transferServer: string): Promise<AnchorInfo> {
    const base = transferServer.replace(/\/$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${base}/info`, { signal: controller.signal });
      if (!res.ok) throw new Error(`info ${res.status}`);
      return await res.json() as AnchorInfo;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isValidUrl(url: string): boolean {
    try { const u = new URL(url); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
  }
}
