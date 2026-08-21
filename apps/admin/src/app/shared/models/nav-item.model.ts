export interface NavItem {
  label: string;
  route: string;
  icon: 'dashboard' | 'tournaments' | 'pigeons' | 'landing' | 'reports' | 'users';
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
  { label: 'Tournaments', route: '/tournaments', icon: 'tournaments' },
  { label: 'Landing Times', route: '/landing-times', icon: 'landing' },
  { label: 'Reports', route: '/reports', icon: 'reports' },
  { label: 'Users', route: '/users', icon: 'users' },
];
