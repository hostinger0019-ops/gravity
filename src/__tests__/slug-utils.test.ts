import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the GPU backend client
vi.mock('@/lib/gpuBackend', () => {
  const state = { lastSlug: '', excludeIdUsed: false };
  const mockGpu = {
    chatbots: {
      isSlugAvailable: vi.fn(async (slug: string, excludeId?: string) => {
        state.lastSlug = slug;
        if (excludeId) state.excludeIdUsed = true;
        // Simulate: slugs containing 'taken' are unavailable
        return !slug.includes('taken');
      }),
    },
  };
  return { gpu: mockGpu, __state: state };
});

import { isSlugAvailable } from '@/data/chatbots';
import { __state as mockState } from '@/lib/gpuBackend';

describe('isSlugAvailable', () => {
  beforeEach(() => { (mockState as any).lastSlug = ''; (mockState as any).excludeIdUsed = false; });

  it('returns true when slug free', async () => {
    const ok = await isSlugAvailable('free-slug');
    expect(ok).toBe(true);
  });

  it('returns false when slug taken', async () => {
    const ok = await isSlugAvailable('already-taken');
    expect(ok).toBe(false);
  });

  it('applies excludeId', async () => {
    const ok = await isSlugAvailable('already-taken', 'some-id');
    expect(ok).toBe(false);
    expect((mockState as any).excludeIdUsed).toBe(true);
  });
});
