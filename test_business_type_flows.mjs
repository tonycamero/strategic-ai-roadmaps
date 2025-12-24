// Business Type Profiles - API Flow Test
// Tests both Professional Services and Chamber flows programmatically

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function register(email, name, company) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'TestPass123!',
      name,
      company,
      industry: 'Accounting & CPA',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Register failed: ${res.status} ${err}`);
  }

  return res.json();
}

async function getDashboard(token) {
  const res = await fetch(`${BASE_URL}/api/dashboard/owner`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dashboard fetch failed: ${res.status} ${err}`);
  }

  return res.json();
}

async function updateBusinessType(token, businessType) {
  const res = await fetch(`${BASE_URL}/api/tenants/business-type`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ businessType }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Business type update failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  console.log(`  ✓ Updated to ${businessType}:`, JSON.stringify(data.tenant));
}

async function testProfessionalServicesFlow() {
  console.log('\n🔵 TEST 1: Professional Services Flow');
  console.log('==========================================');

  const timestamp = Date.now();
  const email = `pro-test-${timestamp}@example.com`;

  console.log(`1. Registering: ${email}`);
  const { token, user } = await register(email, 'Pro Test Owner', `Pro Test Co ${timestamp}`);
  console.log(`  ✓ Created user: ${user.id} (role: ${user.role})`);

  console.log('2. Fetching initial tenant state...');
  const dash1 = await getDashboard(token);
  console.log(`  ✓ Initial businessType: ${dash1.tenant.businessType}`);
  
  if (dash1.tenant.businessType !== 'default') {
    throw new Error(`Expected initial businessType='default', got '${dash1.tenant.businessType}'`);
  }

  console.log('3. Selecting Professional Services (default)...');
  await updateBusinessType(token, 'default');

  console.log('4. Verifying businessType persisted...');
  const dash2 = await getDashboard(token);
  console.log(`  ✓ Final businessType: ${dash2.tenant.businessType}`);

  if (dash2.tenant.businessType !== 'default') {
    throw new Error(`Expected businessType='default', got '${dash2.tenant.businessType}'`);
  }

  console.log('✅ Professional Services flow PASSED\n');
}

async function testChamberFlow() {
  console.log('\n🏛️  TEST 2: Chamber of Commerce Flow');
  console.log('==========================================');

  const timestamp = Date.now();
  const email = `chamber-test-${timestamp}@example.com`;

  console.log(`1. Registering: ${email}`);
  const { token, user } = await register(email, 'Chamber Test Owner', `Chamber Test ${timestamp}`);
  console.log(`  ✓ Created user: ${user.id} (role: ${user.role})`);

  console.log('2. Fetching initial tenant state...');
  const dash1 = await getDashboard(token);
  console.log(`  ✓ Initial businessType: ${dash1.tenant.businessType}`);

  if (dash1.tenant.businessType !== 'default') {
    throw new Error(`Expected initial businessType='default', got '${dash1.tenant.businessType}'`);
  }

  console.log('3. Selecting Chamber of Commerce...');
  await updateBusinessType(token, 'chamber');

  console.log('4. Verifying businessType persisted...');
  const dash2 = await getDashboard(token);
  console.log(`  ✓ Final businessType: ${dash2.tenant.businessType}`);

  if (dash2.tenant.businessType !== 'chamber') {
    throw new Error(`Expected businessType='chamber', got '${dash2.tenant.businessType}'`);
  }

  console.log('✅ Chamber flow PASSED\n');
}

async function main() {
  console.log('🔍 Business Type Profiles - API Flow Verification');
  console.log('================================================\n');
  console.log(`Target: ${BASE_URL}\n`);

  try {
    await testProfessionalServicesFlow();
    await testChamberFlow();

    console.log('🎉 ALL TESTS PASSED\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

main();
