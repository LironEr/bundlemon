import { TtlCache } from '../ttlCache';

describe('TtlCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns cached value until it expires', () => {
    const cache = new TtlCache<string, number>(1000, 10);
    cache.set('a', 1);

    expect(cache.get('a')).toBe(1);

    jest.advanceTimersByTime(999);
    expect(cache.get('a')).toBe(1);

    jest.advanceTimersByTime(1);
    expect(cache.get('a')).toBeUndefined();
  });

  test('evicts the oldest entry when exceeding max size', () => {
    const cache = new TtlCache<string, number>(1000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  test('overriding a key refreshes its TTL and position', () => {
    const cache = new TtlCache<string, number>(1000, 2);
    cache.set('a', 1);
    cache.set('b', 2);

    jest.advanceTimersByTime(500);
    cache.set('a', 10);
    cache.set('c', 3);

    expect(cache.get('b')).toBeUndefined();

    jest.advanceTimersByTime(600);
    expect(cache.get('a')).toBe(10);
  });

  test('delete and clear', () => {
    const cache = new TtlCache<string, number>(1000, 10);
    cache.set('a', 1);
    cache.set('b', 2);

    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);

    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });
});
