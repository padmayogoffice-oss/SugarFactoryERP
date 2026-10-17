/**
 * Database seeder. Creates the role templates, the super admin account and
 * registry-driven demo records. Idempotent: roles and the admin are upserted, so
 * re-running never duplicates them.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/connectDB.js';
import Role from '../models/Role.js';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import { buildResourceModels } from '../models/resourceModel.js';
import { permissionCatalog } from '../registry/index.js';
import { ROLE_TEMPLATES, expandPermissions } from './roles.js';
import { seedDemoData } from './demoData.js';

async function seedRoles() {
  const results = [];

  for (const template of ROLE_TEMPLATES) {
    const permissions = template.permissions.includes('*') ? ['*'] : expandPermissions(template.permissions);
    const role = await Role.findOneAndUpdate(
      { code: template.code },
      {
        code: template.code,
        name: template.name,
        description: template.description,
        permissions,
        isSystem: template.isSystem,
        status: 'active',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    results.push({ code: role.code, permissions: permissions.length });
  }

  return results;
}

async function seedSuperAdmin() {
  const email = (process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@sugarfactory.com').toLowerCase();
  let user = await User.findOne({ email }).select('+passwordHash');
  const created = !user;

  if (!user) {
    user = new User({
      employeeCode: 'EMP0001',
      firstName: 'Super',
      lastName: 'Admin',
      email,
      isSuperAdmin: true,
      status: 'active',
      remarks: 'Seeded super administrator account',
    });
  }

  user.isSuperAdmin = true;
  user.status = 'active';
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.setPassword(process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin@12345');
  await user.save();
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  return { email, created };
}

async function run() {
  await connectDB();
  const adminOnly = process.argv.includes('--admin-only');

  if (!adminOnly) {
    console.log(`Registering ${permissionCatalog.length} permissions across the module registry...`);
    const roles = await seedRoles();
    for (const role of roles) {
      console.log(`  role ${role.code.padEnd(24)} ${role.permissions === 1 ? 'all permissions' : `${role.permissions} permissions`}`);
    }
  }

  const admin = await seedSuperAdmin();
  console.log(`Super admin ${admin.email} ${admin.created ? 'created' : 'updated'}; seed credentials are active`);

  if (!adminOnly) {
    const resources = buildResourceModels();
    await seedDemoData(resources, { recordsPerSubmodule: 4 });
  }

  console.log(adminOnly ? '\nSuper admin setup complete.' : '\nSeed complete.');
  console.log(`Login email: ${process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@sugarfactory.com'}`);
  console.log('Login password: SEED_SUPER_ADMIN_PASSWORD (defaults to Admin@12345)');

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
