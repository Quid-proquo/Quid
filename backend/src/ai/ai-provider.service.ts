import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AI provider port for issue #315.
 *
 * `provider` is selected with AI_PROVIDER:
 *  - "openai"  → calls the OpenAI Chat Completions API (AI_API_KEY required)
 *  - "stub"    → deterministic offline summarizer, no network calls
 *
 * The stub is the default so the job ships green in every environment; the
 * go/no-go for wiring a real provider is documented in docs/ai-summary.md.
 */
@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  private readonly provider: 'openai' | 'stub';
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    const configured = this.config.get<string>('AI_PROVIDER', 'stub');
    this.provider = configured === 'openai' ? 'openai' : 'stub';
    this.apiKey = this.config.get<string>('AI_API_KEY');
    this.model = this.config.get<string>('AI_MODEL', 'gpt-4o-mini');
    this.baseUrl = this.config.get<string>(
      'AI_BASE_URL',
      'https://api.openai.com/v1',
    );

    if (this.provider === 'openai' && !this.apiKey) {
      this.logger.warn(
        'AI_PROVIDER=openai but AI_API_KEY is not set — falling back to the stub summarizer.',
      );
      this.provider = 'stub';
    }
  }

  isLive(): boolean {
    return this.provider === 'openai';
  }

  /**
   * Produces a short neutral summary and a sentiment score in [-1, 1].
   * Never throws — a failed AI call must not fail the ingestion job.
   */
  async summarizeFeedback(text: string): Promise<SummarizeResult> {
    const input = (text ?? '').trim();
    if (!input) {
      return { summary: '', sentiment: 0, provider: this.provider };
    }

    if (this.provider === 'openai') {
      try {
        return await this.summarizeWithOpenAi(input);
      } catch (error: unknown) {
        this.logger.warn(
          `OpenAI summary failed, using stub fallback: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    return this.stubSummarize(input);
  }

  private async summarizeWithOpenAi(text: string): Promise<SummarizeResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'You summarize product-testing feedback for mission creators. ' +
                'Reply ONLY with compact JSON: {"summary": "<=3 sentences", "sentiment": number in [-1,1]}',
            },
            { role: 'user', content: text.slice(0, 8_000) },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI responded ${response.status}`);
      }

      const body = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = body.choices?.[0]?.message?.content ?? '';
      const parsed = JSON.parse(content) as {
        summary?: string;
        sentiment?: number;
      };

      return {
        summary: (parsed.summary ?? '').slice(0, 2_000),
        sentiment: clampScore(parsed.sentiment ?? 0),
        provider: 'openai',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Deterministic, dependency-free fallback: first sentences as the summary,
   * lexicon-based sentiment. Good enough to make the field readable while a
   * real provider decision is pending.
   */
  private stubSummarize(text: string): SummarizeResult {
    const sentences = text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);

    const summary =
      sentences.slice(0, 3).join(' ').slice(0, 400) ||
      text.slice(0, 400);

    return {
      summary,
      sentiment: lexiconSentiment(text),
      provider: 'stub',
    };
  }
}

export interface SummarizeResult {
  summary: string;
  /** Sentiment score in [-1, 1]; negative = unhappy hunter. */
  sentiment: number;
  provider: 'openai' | 'stub';
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

const POSITIVE = [
  'love', 'great', 'good', 'excellent', 'amazing', 'easy', 'intuitive',
  'smooth', 'helpful', 'fast', 'nice', 'awesome', 'perfect', 'clear',
  'enjoyed', 'impressive', 'works', 'useful',
];

const NEGATIVE = [
  'hate', 'bad', 'terrible', 'broken', 'bug', 'crash', 'slow', 'confusing',
  'difficult', 'hard', 'annoying', 'frustrating', 'failed', 'fails', 'error',
  'laggy', 'ugly', 'unclear', 'issue', 'issues', 'problem', 'problems',
];

function lexiconSentiment(text: string): number {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  let score = 0;
  let hits = 0;

  for (const word of words) {
    if (POSITIVE.includes(word)) {
      score += 1;
      hits += 1;
    } else if (NEGATIVE.includes(word)) {
      score -= 1;
      hits += 1;
    }
  }

  if (hits === 0) return 0;
  return clampScore(score / Math.max(hits, 3));
}
