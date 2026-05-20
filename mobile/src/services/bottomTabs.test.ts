import { describe, expect, it } from 'vitest';
import { BOTTOM_TAB_ITEMS } from './bottomTabs';

describe('BOTTOM_TAB_ITEMS', () => {
  it('contains only Feed, +, and Mine', () => {
    expect(BOTTOM_TAB_ITEMS.map((item) => item.key)).toEqual(['feed', 'create', 'mine']);
    expect(BOTTOM_TAB_ITEMS.map((item) => item.label)).toEqual(['Feed', 'Create', 'Mine']);
    expect(BOTTOM_TAB_ITEMS.some((item) => /alert|notification/i.test(item.label))).toBe(false);
  });
});
