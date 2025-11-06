export const DEFAULT_PAGINATION_LIMIT = 5;

export type PaginationInput = {
  last?: string;
  limit: number;
};

export class PaginationUtils {
  static encodeCursor({ last, limit }: PaginationInput): string {
    const cursorObj: PaginationInput = {
      limit: limit || DEFAULT_PAGINATION_LIMIT,
    };
    if (last) {
      cursorObj.last = last;
    }

    return Buffer.from(JSON.stringify(cursorObj)).toString('base64');
  }

  static decodeCursor(encodedCursor: string): PaginationInput {
    try {
      let cursorObj: PaginationInput = JSON.parse(
        Buffer.from(encodedCursor, 'base64').toString('utf-8'),
      );
      return cursorObj;
    } catch (err) {
      throw new Error('Invalid cursor format');
    }
  }
}
