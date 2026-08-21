export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CLUB_ADMIN = 'CLUB_ADMIN',
  DATA_ENTRY_OPERATOR = 'DATA_ENTRY_OPERATOR',
  PARTICIPANT = 'PARTICIPANT',
  ORGANIZER = 'ORGANIZER',
}

export enum AuthTokenType {
  USER = 'USER',
  ORGANIZER = 'ORGANIZER',
}

export enum Permission {
  USERS_READ = 'users:read',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  TOURNAMENTS_READ = 'tournaments:read',
  TOURNAMENTS_CREATE = 'tournaments:create',
  TOURNAMENTS_UPDATE = 'tournaments:update',
  TOURNAMENTS_DELETE = 'tournaments:delete',
  TOURNAMENTS_PUBLISH = 'tournaments:publish',
  PIGEONS_READ = 'pigeons:read',
  PIGEONS_CREATE = 'pigeons:create',
  PIGEONS_UPDATE = 'pigeons:update',
  PIGEONS_DELETE = 'pigeons:delete',
  ENTRIES_READ = 'entries:read',
  ENTRIES_CREATE = 'entries:create',
  ENTRIES_UPDATE = 'entries:update',
  PARTICIPANTS_READ = 'participants:read',
  PARTICIPANTS_CREATE = 'participants:create',
  PARTICIPANTS_UPDATE = 'participants:update',
  PARTICIPANTS_DELETE = 'participants:delete',
  ROLES_MANAGE = 'roles:manage',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
  tokenType?: AuthTokenType;
  tournamentId?: string;
  iat?: number;
  exp?: number;
}

export function isOrganizerToken(
  payload?: { role?: string; tokenType?: string } | null,
): boolean {
  return (
    payload?.tokenType === AuthTokenType.ORGANIZER || payload?.role === UserRole.ORGANIZER
  );
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
