export class CacheUtils {
  static getCacheTTLSeconds(): number {
    return 20;
  }

  static buildCacheKey(input: Record<string, any>): string {
    return Buffer.from(JSON.stringify(input)).toString('base64');
  }
}
