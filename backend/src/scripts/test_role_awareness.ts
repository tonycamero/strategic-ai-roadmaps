import * as dotenv from 'dotenv';
dotenv.config();

import { wrapUserMessageWithRoleContext } from '../config/role-runtime-context';

/**
 * Smoke test for role-aware context wrapper
 * Shows how the same question gets different framing based on role
 */

const testQuestion = "What should I focus on this week?";

console.log('=== Role-Aware Context Wrapper Test ===\n');

console.log('Original question:', testQuestion);
console.log('\n---\n');

// Test each role
const roles: Array<'owner' | 'ops' | 'sales' | 'delivery' | 'superadmin'> = [
  'owner',
  'ops',
  'sales',
  'delivery',
  'superadmin',
];

roles.forEach((role) => {
  console.log(`\n📋 Role: ${role.toUpperCase()}`);
  console.log('Wrapped message:');
  const wrapped = wrapUserMessageWithRoleContext(testQuestion, role);
  console.log(wrapped);
  console.log('\n' + '─'.repeat(80));
});

console.log('\n\n✅ Test complete!');
console.log('\nExpected behavior:');
console.log('- Owner: Gets strategic, delegation-focused guidance');
console.log('- Ops: Gets tactical, system-focused checklist');
console.log('- Sales: Gets pipeline and conversion-focused advice');
console.log('- Delivery: Gets client journey and handoff guidance');
console.log('- Superadmin: Can reason across firms/templates');
