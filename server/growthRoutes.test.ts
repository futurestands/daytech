import { describe, expect, it } from 'vitest';
import { safeCsvCell } from './growthRoutes';

describe('CSV formula protection', () => {
  it.each(['=1+1', '+4', '-4', '@SUM(A1)', '\t=1+1', ' =1+1', '\uFEFF=1+1'])('escapes cells with dangerous prefixes', value => {
    expect(safeCsvCell(value)).toBe('"' + "'" + value + '"');
  });
  it('quotes embedded separators and quotes', () => {
    expect(safeCsvCell('a,"b"')).toBe('"a,""b"""');
  });
});
