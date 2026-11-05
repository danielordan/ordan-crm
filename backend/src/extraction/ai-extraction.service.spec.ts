import type { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { Env } from '../common/config/env.schema';
import { OpenAIShipmentDataExtractor } from './ai-extraction.service';
import { ExtractionError } from './extraction.errors';
import type { ExtractedData } from './extraction.schema';

const data: ExtractedData = {
  companyName: 'Acme Trading Ltd',
  address: null,
  phone: null,
  email: 'info@acme.com',
  originPort: 'Shanghai',
  originCountry: 'China',
  destinationPort: 'Haifa',
  incoterms: 'FOB',
  shipmentType: 'LCL',
};

function setup(parse: jest.Mock, timeoutMs = 1000) {
  const settings: Record<string, unknown> = {
    OPENAI_MODEL: 'test-model',
    OPENAI_TIMEOUT_MS: timeoutMs,
  };
  const config = { get: (key: string) => settings[key] } as unknown as ConfigService<Env, true>;
  const client = { responses: { parse } } as unknown as Pick<OpenAI, 'responses'>;
  return new OpenAIShipmentDataExtractor(client, config);
}

const failure = (category: string) => new ExtractionError(category as never);

describe('OpenAIShipmentDataExtractor', () => {
  it('returns the parsed data', async () => {
    const parse = jest.fn().mockResolvedValue({ status: 'completed', output_parsed: data });
    await expect(setup(parse).extract('document text')).resolves.toEqual(data);
  });

  it('sends the document as data, without storing it and without retries', async () => {
    const parse = jest.fn().mockResolvedValue({ status: 'completed', output_parsed: data });
    await setup(parse).extract('document text');

    const [body, options] = parse.mock.calls[0] as [
      { model: string; store: boolean; input: string; instructions: string },
      { maxRetries: number; signal: AbortSignal },
    ];
    expect(body.model).toBe('test-model');
    expect(body.store).toBe(false);
    expect(body.input).toContain('document text');
    expect(body.instructions).not.toContain('document text');
    expect(body.instructions).toContain('only if that exact term appears');
    expect(options.maxRetries).toBe(0);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('fails with AI_TIMEOUT when the time limit passes', async () => {
    // Never answers on its own; rejects only when the request is cancelled
    const parse = jest.fn(
      (_body: unknown, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    await expect(setup(parse as unknown as jest.Mock, 10).extract('x')).rejects.toEqual(
      failure('AI_TIMEOUT'),
    );
  });

  it('fails with AI_API_ERROR when the API call fails', async () => {
    const parse = jest
      .fn()
      .mockRejectedValue(new OpenAI.APIConnectionError({ message: 'connection failed' }));
    await expect(setup(parse).extract('x')).rejects.toEqual(failure('AI_API_ERROR'));
  });

  it.each([
    ['a refusal', { status: 'completed', output_parsed: null }],
    ['a cut-off answer', { status: 'incomplete', output_parsed: data }],
    ['invalid data', { status: 'completed', output_parsed: { ...data, shipmentType: 'AIR' } }],
    ['a missing field', { status: 'completed', output_parsed: { companyName: 'Acme' } }],
  ])('fails with AI_SCHEMA_ERROR on %s', async (_name, response) => {
    const parse = jest.fn().mockResolvedValue(response);
    await expect(setup(parse).extract('x')).rejects.toEqual(failure('AI_SCHEMA_ERROR'));
  });

  it('fails with AI_SCHEMA_ERROR when the answer cannot be read', async () => {
    const parse = jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'));
    await expect(setup(parse).extract('x')).rejects.toEqual(failure('AI_SCHEMA_ERROR'));
  });
});
