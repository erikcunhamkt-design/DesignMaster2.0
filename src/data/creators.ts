export interface Creator {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
}

export const creators: Creator[] = [
  {
    id: 'generalista',
    name: 'Generalista',
    description: 'Cria de tudo',
    icon: '🎨',
    route: '/criar/generalista',
  },
];
