import { CacheUtils } from './cache.utils';

describe('CacheUtils', () => {
  it('getCacheTTLSeconds returns the configured TTL (20)', () => {
    const ttl = CacheUtils.getCacheTTLSeconds();
    expect(typeof ttl).toBe('number');
    expect(ttl).toBe(20);
  });

  it('buildCacheKey returns base64(JSON.stringify(input))', () => {
    const input = { a: 1, b: 'two' };
    const expected = Buffer.from(JSON.stringify(input)).toString('base64');
    expect(CacheUtils.buildCacheKey(input)).toBe(expected);
  });

  it('buildCacheKey is deterministic for equivalent objects with same key order', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 1, y: 2 };
    expect(CacheUtils.buildCacheKey(a)).toBe(CacheUtils.buildCacheKey(b));
  });

  it('current implementation is sensitive to property order (implementation detail', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 2, a: 1 };
    expect(CacheUtils.buildCacheKey(obj1)).not.toBe(
      CacheUtils.buildCacheKey(obj2),
    );
  });
});
