import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD,
} from './seed-data';
import { UserRole } from '@kabootar/shared';

const prisma = new PrismaClient();

async function seedRolesAndPermissions() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { slug: permission.slug },
      update: { name: permission.name, description: permission.description },
      create: permission,
    });
  }

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const permissionMap = new Map(permissions.map((p) => [p.slug, p.id]));

  for (const role of roles) {
    const roleSlug = role.slug as UserRole;
    const slugs = ROLE_PERMISSIONS[roleSlug] ?? [];

    for (const slug of slugs) {
      const permissionId = permissionMap.get(slug);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId },
        },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  return prisma.role.findUniqueOrThrow({ where: { slug: UserRole.SUPER_ADMIN } });
}

async function seedSuperAdmin(superAdminRoleId: string) {
  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: { roleId: superAdminRoleId },
    create: {
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: superAdminRoleId,
    },
  });

  return admin;
}

async function main() {
  console.log('Seeding roles and permissions...');
  const superAdminRole = await seedRolesAndPermissions();

  console.log('Seeding Super Admin user...');
  const admin = await seedSuperAdmin(superAdminRole.id);

  console.log(`Seeded Super Admin: ${admin.email}`);
  console.log(`Default password: ${SUPER_ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
