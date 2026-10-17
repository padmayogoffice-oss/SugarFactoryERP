const env = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const Role = require('../models/Role');
const User = require('../models/User');
const { buildResourceModels } = require('../models/resourceModel');
const { permissionCatalog } = require('../registry');
const { ROLE_TEMPLATES, expandPermissions } = require('./roles');
const { seedDemoData } = require('./demoData');

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
  const email = env.seed.superAdminEmail.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.isSuperAdmin = true;
    existing.status = 'active';
    await existing.save();
    return { email, created: false };
  }

  const user = new User({
    employeeCode: 'EMP0001',
    firstName: 'Super',
    lastName: 'Admin',
    email,
    isSuperAdmin: true,
    status: 'active',
    remarks: 'Seeded super administrator account',
  });
  await user.setPassword(env.seed.superAdminPassword);
  await user.save();

  return { email, created: true };
}

async function run() {
  await connectDatabase();

  console.log(`Registering ${permissionCatalog.length} permissions across the module registry...`);
  const roles = await seedRoles();
  for (const role of roles) {
    console.log(`  role ${role.code.padEnd(24)} ${role.permissions === 1 ? 'all permissions' : `${role.permissions} permissions`}`);
  }

  const admin = await seedSuperAdmin();
  console.log(`Super admin ${admin.email} ${admin.created ? 'created' : 'already existed (updated)'}`);

  const resources = buildResourceModels();
  await seedDemoData(resources, { recordsPerSubmodule: 4 });

  console.log('\nSeed complete.');
  console.log(`Login with: ${env.seed.superAdminEmail} / ${env.seed.superAdminPassword}`);

  await disconnectDatabase();
}

run().catch(async (error) => {
  console.error('Seed failed:', error);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
