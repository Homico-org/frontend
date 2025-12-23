/**
 * Script to seed test users on dev and prod environments
 *
 * Usage:
 *   node scripts/seed-test-users.js dev    # Add users to dev
 *   node scripts/seed-test-users.js prod   # Add users to prod
 *   node scripts/seed-test-users.js all    # Add users to both
 */

const API_URLS = {
  dev: 'https://api.dev.homico.ge',
  prod: 'https://homico-backend.onrender.com'
};

// Realistic Georgian test users
const TEST_USERS = {
  clients: [
    {
      name: 'გიორგი მელიქიშვილი',
      email: 'giorgi.melikishvili@demo.com',
      password: 'DemoPass123',
      role: 'client',
      phone: '+995591001001',
      city: 'tbilisi'
    },
    {
      name: 'ნინო კვარაცხელია',
      email: 'nino.kvaratskhelia@demo.com',
      password: 'DemoPass123',
      role: 'client',
      phone: '+995591001002',
      city: 'tbilisi'
    },
    {
      name: 'დავით ბერიძე',
      email: 'davit.beridze@demo.com',
      password: 'DemoPass123',
      role: 'client',
      phone: '+995591001003',
      city: 'batumi'
    },
    {
      name: 'მარიამ ჯანელიძე',
      email: 'mariam.janelidze@demo.com',
      password: 'DemoPass123',
      role: 'client',
      phone: '+995591001004',
      city: 'kutaisi'
    },
    {
      name: 'ალექსანდრე გოგიაშვილი',
      email: 'alex.gogiashvili@demo.com',
      password: 'DemoPass123',
      role: 'client',
      phone: '+995591001005',
      city: 'tbilisi'
    }
  ],
  professionals: [
    {
      name: 'ლევან ნიკოლაძე',
      email: 'levan.nikoladze@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002001',
      city: 'tbilisi',
      selectedCategories: ['renovation'],
      selectedSubcategories: ['full-renovation', 'cosmetic-repair'],
      accountType: 'individual'
    },
    {
      name: 'თამარ წულაძე',
      email: 'tamar.tsuladze@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002002',
      city: 'tbilisi',
      selectedCategories: ['design'],
      selectedSubcategories: ['interior', '3d-visualization'],
      accountType: 'individual'
    },
    {
      name: 'ზურაბ ხარაიშვილი',
      email: 'zurab.kharaishvili@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002003',
      city: 'tbilisi',
      selectedCategories: ['architecture'],
      selectedSubcategories: ['residential-architecture', 'project-documentation'],
      accountType: 'individual'
    },
    {
      name: 'ელენე მამულაშვილი',
      email: 'elene.mamulashvili@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002004',
      city: 'batumi',
      selectedCategories: ['design'],
      selectedSubcategories: ['exterior', 'landscape-design'],
      accountType: 'individual'
    },
    {
      name: 'გრემიტ საქართველო',
      email: 'gremit.georgia@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002005',
      city: 'tbilisi',
      selectedCategories: ['renovation', 'services'],
      selectedSubcategories: ['full-renovation', 'electrical-works', 'plumbing'],
      accountType: 'organization',
      companyName: 'გრემიტ საქართველო'
    },
    {
      name: 'ნიკა გელაშვილი',
      email: 'nika.gelashvili@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002006',
      city: 'tbilisi',
      selectedCategories: ['services'],
      selectedSubcategories: ['electrical-works', 'smart-home'],
      accountType: 'individual'
    },
    {
      name: 'სანდრო ქუთათელაძე',
      email: 'sandro.kutateladze@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002007',
      city: 'kutaisi',
      selectedCategories: ['renovation'],
      selectedSubcategories: ['kitchen-renovation', 'bathroom-renovation'],
      accountType: 'individual'
    },
    {
      name: 'დიზაინ სტუდია ოასისი',
      email: 'design.oasis@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002008',
      city: 'tbilisi',
      selectedCategories: ['design', 'architecture'],
      selectedSubcategories: ['interior', '3d-visualization', 'residential-architecture'],
      accountType: 'organization',
      companyName: 'დიზაინ სტუდია ოასისი'
    },
    {
      name: 'ბექა ლომიძე',
      email: 'beka.lomidze@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002009',
      city: 'tbilisi',
      selectedCategories: ['services'],
      selectedSubcategories: ['plumbing', 'heating-cooling'],
      accountType: 'individual'
    },
    {
      name: 'ანა ჩხეიძე',
      email: 'ana.chkheidze@demo.com',
      password: 'DemoPass123',
      role: 'pro',
      phone: '+995591002010',
      city: 'tbilisi',
      selectedCategories: ['design'],
      selectedSubcategories: ['furniture-design', 'interior'],
      accountType: 'individual'
    }
  ]
};

async function registerUser(apiUrl, userData) {
  try {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`  [OK] Created: ${userData.name} (${userData.email})`);
      return { success: true, data: result };
    } else if (response.status === 409) {
      console.log(`  [SKIP] Already exists: ${userData.name} (${userData.email})`);
      return { success: true, skipped: true };
    } else {
      console.log(`  [ERROR] Failed: ${userData.name} - ${result.message || JSON.stringify(result)}`);
      return { success: false, error: result };
    }
  } catch (error) {
    console.log(`  [ERROR] Network error for ${userData.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function seedEnvironment(env) {
  const apiUrl = API_URLS[env];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Seeding ${env.toUpperCase()} environment: ${apiUrl}`);
  console.log('='.repeat(60));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Seed clients
  console.log('\n--- Creating CLIENT accounts ---');
  for (const user of TEST_USERS.clients) {
    const result = await registerUser(apiUrl, user);
    if (result.success) {
      if (result.skipped) skipped++;
      else created++;
    } else {
      failed++;
    }
  }

  // Seed professionals
  console.log('\n--- Creating PRO accounts ---');
  for (const user of TEST_USERS.professionals) {
    const result = await registerUser(apiUrl, user);
    if (result.success) {
      if (result.skipped) skipped++;
      else created++;
    } else {
      failed++;
    }
  }

  console.log(`\n--- ${env.toUpperCase()} Summary ---`);
  console.log(`Created: ${created} | Skipped: ${skipped} | Failed: ${failed}`);

  return { created, skipped, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'dev';

  console.log('Homico Test User Seeding Script');
  console.log('================================');

  if (target === 'all') {
    await seedEnvironment('dev');
    await seedEnvironment('prod');
  } else if (target === 'dev' || target === 'prod') {
    await seedEnvironment(target);
  } else {
    console.log('Usage: node scripts/seed-test-users.js [dev|prod|all]');
    process.exit(1);
  }

  console.log('\n\nDone! Demo accounts can be accessed via /auth/demo-accounts endpoint');
  console.log('All demo passwords: DemoPass123');
}

main().catch(console.error);
