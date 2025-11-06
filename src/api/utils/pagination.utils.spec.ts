import { PaginationInput, PaginationUtils } from './pagination.utils';

describe('PaginationUtils', () => {
  it('should encode and decode cursor correctly', () => {
    const input: PaginationInput = {
      last: '690c7d0d250f85bfeceb7d63',
      limit: 20,
    };
    const encoded = PaginationUtils.encodeCursor(input);
    const decoded = PaginationUtils.decodeCursor(encoded);
    expect(decoded).toEqual(input);
  });
});
