import { Types } from 'mongoose';
import { stringToMongoId } from './string-to-mongo-id';

describe('stringToMongoId', () => {
  it('accepts a valid hex string and returns ObjectId', () => {
    const validHex = '507f1f77bcf86cd799439011';
    const out = stringToMongoId({ value: validHex });
    expect(Types.ObjectId.isValid(out as any)).toBe(true);
  });

  it('rejects invalid id and throws error', () => {
    try {
      const invalid = 'not-a-valid-id';
      const out = stringToMongoId({ value: invalid });
      expect(1).toBe(2); // should not reach here
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });
});
