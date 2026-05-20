export type BottomTabKey = 'feed' | 'create' | 'mine';

export interface BottomTabItem {
  key: BottomTabKey;
  label: string;
  icon: string;
}

export const BOTTOM_TAB_ITEMS: BottomTabItem[] = [
  { key: 'feed', label: 'Feed', icon: 'F' },
  { key: 'create', label: 'Create', icon: '+' },
  { key: 'mine', label: 'Mine', icon: 'M' },
];
