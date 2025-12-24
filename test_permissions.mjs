const BASE_URL = 'http://localhost:3001';

async function testPermissions() {
  console.log('🔒 PERMISSIONS TEST');
  console.log('===================\n');
  
  // Create owner
  const resOwner = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: `perm-owner-${Date.now()}@example.com`,
      password: 'Test123!',
      name: 'Perm Test Owner',
      company: 'Perm Co',
      industry: 'Accounting & CPA'
    })
  });
  const owner = await resOwner.json();
  console.log('✓ Created owner:', owner.user.role);
  
  // Create invite
  const resInvite = await fetch(`${BASE_URL}/api/invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${owner.token}`
    },
    body: JSON.stringify({
      email: `perm-sales-${Date.now()}@example.com`,
      role: 'sales'
    })
  });
  const inviteData = await resInvite.json();
  console.log('✓ Invite created');
  
  // Get the token
  const inviteToken = inviteData.invite?.token || inviteData.token;
  if (!inviteToken) {
    console.log('❌ No invite token found');
    console.log('Invite data:', JSON.stringify(inviteData));
    return;
  }
  
  // Accept invite
  const resAccept = await fetch(`${BASE_URL}/api/invites/accept`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      token: inviteToken,
      name: 'Sales Test User',
      password: 'Test123!'
    })
  });
  const sales = await resAccept.json();
  console.log('✓ Created sales user, role:', sales.user.role);
  
  // Try business type update as sales (should FAIL with 403)
  console.log('\nAttempting PATCH /api/tenants/business-type as sales user...');
  const resUpdate = await fetch(`${BASE_URL}/api/tenants/business-type`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sales.token}`
    },
    body: JSON.stringify({businessType: 'chamber'})
  });
  
  console.log('  Status:', resUpdate.status);
  const result = await resUpdate.json();
  console.log('  Body:', JSON.stringify(result));
  
  if (resUpdate.status === 403) {
    console.log('\n✅ PASS: 403 Forbidden - Sales user correctly blocked from changing business type');
  } else {
    console.log('\n❌ FAIL: Expected 403, got', resUpdate.status);
  }
}

testPermissions().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
