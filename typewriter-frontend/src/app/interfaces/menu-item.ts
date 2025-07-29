export interface MenuItem {
  id: string;
  name: string;
  icon: string;
  type: 'punctuation' | 'numbers' | 'time' | 'words' | 'quote' | 'custom';
  category: 'secondary' | 'primary';
  active?: boolean;
}

export interface CategoryOption {
  id: string;
  value: string | number;
  label: string;
  category: 'time' | 'words' | 'quote';
}
