import { Permission, UserRole } from '../types/auth';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.CLUB_ADMIN]: 3,
  [UserRole.DATA_ENTRY_OPERATOR]: 2,
  [UserRole.PARTICIPANT]: 1,
  [UserRole.ORGANIZER]: 0,
};

export const ADMIN_ROLES = [UserRole.SUPER_ADMIN];

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.CLUB_ADMIN]: 'Club Admin',
  [UserRole.DATA_ENTRY_OPERATOR]: 'Data Entry Operator',
  [UserRole.PARTICIPANT]: 'Participant',
  [UserRole.ORGANIZER]: 'Tournament Organizer',
};

export const ORGANIZER_PERMISSIONS = [
  Permission.TOURNAMENTS_READ,
  Permission.ENTRIES_READ,
  Permission.ENTRIES_CREATE,
  Permission.ENTRIES_UPDATE,
] as const;
