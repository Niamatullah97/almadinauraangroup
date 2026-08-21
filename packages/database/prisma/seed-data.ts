import { Permission, UserRole } from '@kabootar/shared';

export const ROLES = [
  {
    slug: UserRole.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Full system access',
  },
  {
    slug: UserRole.CLUB_ADMIN,
    name: 'Club Admin',
    description: 'Manages club tournaments, pigeons, and entries',
  },
  {
    slug: UserRole.DATA_ENTRY_OPERATOR,
    name: 'Data Entry Operator',
    description: 'Enters and updates tournament data',
  },
  {
    slug: UserRole.PARTICIPANT,
    name: 'Participant',
    description: 'Registers pigeons and views tournaments',
  },
  {
    slug: UserRole.ORGANIZER,
    name: 'Tournament Organizer',
    description: 'Enters race-day landing times through a shared access link',
  },
] as const;

export const PERMISSIONS = [
  { slug: Permission.USERS_READ, name: 'Read Users', description: 'View user list and profiles' },
  { slug: Permission.USERS_CREATE, name: 'Create Users', description: 'Create new user accounts' },
  { slug: Permission.USERS_UPDATE, name: 'Update Users', description: 'Modify user accounts' },
  { slug: Permission.USERS_DELETE, name: 'Delete Users', description: 'Deactivate user accounts' },
  {
    slug: Permission.TOURNAMENTS_READ,
    name: 'Read Tournaments',
    description: 'View tournaments',
  },
  {
    slug: Permission.TOURNAMENTS_CREATE,
    name: 'Create Tournaments',
    description: 'Create new tournaments',
  },
  {
    slug: Permission.TOURNAMENTS_UPDATE,
    name: 'Update Tournaments',
    description: 'Modify tournament details',
  },
  {
    slug: Permission.TOURNAMENTS_DELETE,
    name: 'Delete Tournaments',
    description: 'Remove tournaments',
  },
  {
    slug: Permission.TOURNAMENTS_PUBLISH,
    name: 'Publish Tournaments',
    description: 'Open tournament registration',
  },
  { slug: Permission.PIGEONS_READ, name: 'Read Pigeons', description: 'View pigeon records' },
  { slug: Permission.PIGEONS_CREATE, name: 'Create Pigeons', description: 'Register pigeons' },
  { slug: Permission.PIGEONS_UPDATE, name: 'Update Pigeons', description: 'Modify pigeon records' },
  { slug: Permission.PIGEONS_DELETE, name: 'Delete Pigeons', description: 'Remove pigeon records' },
  {
    slug: Permission.ENTRIES_READ,
    name: 'Read Entries',
    description: 'View tournament entries',
  },
  {
    slug: Permission.ENTRIES_CREATE,
    name: 'Create Entries',
    description: 'Register tournament entries',
  },
  {
    slug: Permission.ENTRIES_UPDATE,
    name: 'Update Entries',
    description: 'Update entry results and rankings',
  },
  {
    slug: Permission.PARTICIPANTS_READ,
    name: 'Read Participants',
    description: 'View participant and loft records',
  },
  {
    slug: Permission.PARTICIPANTS_CREATE,
    name: 'Create Participants',
    description: 'Register new participants',
  },
  {
    slug: Permission.PARTICIPANTS_UPDATE,
    name: 'Update Participants',
    description: 'Modify participant profiles',
  },
  {
    slug: Permission.PARTICIPANTS_DELETE,
    name: 'Delete Participants',
    description: 'Remove participant records',
  },
  {
    slug: Permission.ROLES_MANAGE,
    name: 'Manage Roles',
    description: 'Manage roles and permissions',
  },
] as const;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.CLUB_ADMIN]: [
    Permission.USERS_READ,
    Permission.TOURNAMENTS_READ,
    Permission.TOURNAMENTS_CREATE,
    Permission.TOURNAMENTS_UPDATE,
    Permission.TOURNAMENTS_DELETE,
    Permission.TOURNAMENTS_PUBLISH,
    Permission.PIGEONS_READ,
    Permission.PIGEONS_CREATE,
    Permission.PIGEONS_UPDATE,
    Permission.PIGEONS_DELETE,
    Permission.ENTRIES_READ,
    Permission.ENTRIES_CREATE,
    Permission.ENTRIES_UPDATE,
    Permission.PARTICIPANTS_READ,
    Permission.PARTICIPANTS_CREATE,
    Permission.PARTICIPANTS_UPDATE,
    Permission.PARTICIPANTS_DELETE,
  ],
  [UserRole.DATA_ENTRY_OPERATOR]: [
    Permission.TOURNAMENTS_READ,
    Permission.PIGEONS_READ,
    Permission.PIGEONS_CREATE,
    Permission.PIGEONS_UPDATE,
    Permission.ENTRIES_READ,
    Permission.ENTRIES_CREATE,
    Permission.ENTRIES_UPDATE,
    Permission.PARTICIPANTS_READ,
    Permission.PARTICIPANTS_CREATE,
    Permission.PARTICIPANTS_UPDATE,
  ],
  [UserRole.PARTICIPANT]: [
    Permission.TOURNAMENTS_READ,
    Permission.PIGEONS_READ,
    Permission.PIGEONS_CREATE,
    Permission.PIGEONS_UPDATE,
    Permission.ENTRIES_READ,
  ],
  [UserRole.ORGANIZER]: [
    Permission.TOURNAMENTS_READ,
    Permission.ENTRIES_READ,
    Permission.ENTRIES_CREATE,
    Permission.ENTRIES_UPDATE,
  ],
};

export const SUPER_ADMIN_EMAIL = 'superadmin@kabootar.local';
export const SUPER_ADMIN_PASSWORD = 'SuperAdmin@123';
