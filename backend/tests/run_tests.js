const http = require('http');
const path = require('path');
const { createApp } = require('../dist/app');
const { runMigrations } = require('../dist/database/migrate');
const { db } = require('../dist/database/connection');

const results = [];

function assert(condition, testName, failureMessage) {
  if (condition) {
    results.push({ name: testName, passed: true });
    console.log(`  ✓ ${testName}`);
  } else {
    results.push({ name: testName, passed: false, message: failureMessage });
    console.error(`  ✗ ${testName}: ${failureMessage}`);
  }
}

async function makeRequest(serverPort, method, reqPath, body, token) {
  return new Promise((resolve, reject) => {
    const jsonBody = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path: reqPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(jsonBody ? { 'Content-Length': Buffer.byteLength(jsonBody) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsedBody = null;
          try {
            parsedBody = JSON.parse(rawData);
          } catch {
            parsedBody = rawData;
          }
          resolve({
            status: res.statusCode || 500,
            body: parsedBody,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (jsonBody) {
      req.write(jsonBody);
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('\n====================================================');
  console.log(' STARTING MODULE 1: AUTHENTICATION VERIFICATION SUITE');
  console.log('====================================================\n');

  // Initialize DB
  runMigrations();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  const port = address.port;
  console.log(`Test server running on ephemeral port: ${port}\n`);

  try {
    // ----------------------------------------------------
    // TEST 1: Valid login
    // ----------------------------------------------------
    const loginRes = await makeRequest(port, 'POST', '/api/auth/login', {
      email: 'admin@stockit.local',
      password: 'Admin@123456',
    });
    assert(
      loginRes.status === 200 &&
        loginRes.body.success === true &&
        typeof loginRes.body.data.token === 'string' &&
        loginRes.body.data.user.email === 'admin@stockit.local',
      'TEST 1: Valid login',
      `Expected status 200 with valid JWT, got ${loginRes.status}`
    );
    const adminToken = loginRes.body && loginRes.body.data ? loginRes.body.data.token : null;

    // ----------------------------------------------------
    // TEST 2: Invalid password
    // ----------------------------------------------------
    const invalidPassRes = await makeRequest(port, 'POST', '/api/auth/login', {
      email: 'admin@stockit.local',
      password: 'WrongPassword999',
    });
    assert(
      invalidPassRes.status === 401 && invalidPassRes.body.success === false,
      'TEST 2: Invalid password',
      `Expected status 401, got ${invalidPassRes.status}`
    );

    // ----------------------------------------------------
    // TEST 3: Invalid email
    // ----------------------------------------------------
    const invalidEmailRes = await makeRequest(port, 'POST', '/api/auth/login', {
      email: 'not-an-email-at-all',
      password: 'SomePassword123',
    });
    assert(
      invalidEmailRes.status === 400 && invalidEmailRes.body.errors && invalidEmailRes.body.errors.email,
      'TEST 3: Invalid email',
      `Expected status 400 with email validation error, got ${invalidEmailRes.status}`
    );

    // ----------------------------------------------------
    // TEST 4: Empty login fields
    // ----------------------------------------------------
    const emptyFieldsRes = await makeRequest(port, 'POST', '/api/auth/login', {
      email: '',
      password: '',
    });
    assert(
      emptyFieldsRes.status === 400 &&
        emptyFieldsRes.body.errors &&
        emptyFieldsRes.body.errors.email &&
        emptyFieldsRes.body.errors.password,
      'TEST 4: Empty login fields',
      `Expected status 400 with both fields flagged, got ${emptyFieldsRes.status}`
    );

    // ----------------------------------------------------
    // TEST 5: Register valid user
    // ----------------------------------------------------
    const testUserEmail = `user_${Date.now()}@stockit.local`;
    const regRes = await makeRequest(port, 'POST', '/api/auth/register', {
      full_name: 'Inventory Special Officer',
      email: testUserEmail,
      password: 'StrongPass@2026',
      confirm_password: 'StrongPass@2026',
      role: 'INVENTORY_MANAGER',
    });
    assert(
      regRes.status === 201 &&
        regRes.body.success === true &&
        regRes.body.data.user.role === 'INVENTORY_MANAGER' &&
        typeof regRes.body.data.token === 'string',
      'TEST 5: Register valid user',
      `Expected status 201 with created user, got ${regRes.status}`
    );
    const newUserId = regRes.body && regRes.body.data && regRes.body.data.user ? regRes.body.data.user.id : null;
    const newUserToken = regRes.body && regRes.body.data ? regRes.body.data.token : null;

    // ----------------------------------------------------
    // TEST 6: Register duplicate email
    // ----------------------------------------------------
    const dupRes = await makeRequest(port, 'POST', '/api/auth/register', {
      full_name: 'Duplicate User Attempt',
      email: testUserEmail,
      password: 'AnotherPassword@1',
      confirm_password: 'AnotherPassword@1',
      role: 'VIEWER',
    });
    assert(
      dupRes.status === 409 && dupRes.body.success === false,
      'TEST 6: Register duplicate email',
      `Expected status 409 Conflict, got ${dupRes.status}`
    );

    // ----------------------------------------------------
    // TEST 7: Password and confirm password mismatch
    // ----------------------------------------------------
    const mismatchRes = await makeRequest(port, 'POST', '/api/auth/register', {
      full_name: 'Mismatch Tester',
      email: 'mismatch@stockit.local',
      password: 'OriginalPassword1',
      confirm_password: 'DifferentPassword2',
      role: 'SALES_MANAGER',
    });
    assert(
      mismatchRes.status === 400 && mismatchRes.body.errors && mismatchRes.body.errors.confirm_password,
      'TEST 7: Password and confirm password mismatch',
      `Expected status 400 with confirm_password error, got ${mismatchRes.status}`
    );

    // ----------------------------------------------------
    // TEST 8: Invalid role
    // ----------------------------------------------------
    const invalidRoleRes = await makeRequest(port, 'POST', '/api/auth/register', {
      full_name: 'Role Hacker',
      email: 'hacker@stockit.local',
      password: 'ValidPassword123',
      confirm_password: 'ValidPassword123',
      role: 'SUPER_ROOT_UNAUTHORIZED_ROLE',
    });
    assert(
      invalidRoleRes.status === 400 && invalidRoleRes.body.errors && invalidRoleRes.body.errors.role,
      'TEST 8: Invalid role',
      `Expected status 400 rejecting unauthorized role, got ${invalidRoleRes.status}`
    );

    // ----------------------------------------------------
    // TEST 9: Logout
    // ----------------------------------------------------
    const logoutRes = await makeRequest(port, 'POST', '/api/auth/logout');
    assert(
      logoutRes.status === 200 && logoutRes.body.success === true,
      'TEST 9: Logout',
      `Expected status 200 confirming logout, got ${logoutRes.status}`
    );

    // ----------------------------------------------------
    // TEST 10: Try accessing protected page without authentication
    // ----------------------------------------------------
    const unauthRes = await makeRequest(port, 'GET', '/api/auth/me');
    assert(
      unauthRes.status === 401 && unauthRes.body.success === false,
      'TEST 10: Try accessing protected page without authentication',
      `Expected status 401 Unauthorized, got ${unauthRes.status}`
    );

    // ----------------------------------------------------
    // TEST 11: Access protected page after successful login
    // ----------------------------------------------------
    const authMeRes = await makeRequest(port, 'GET', '/api/auth/me', undefined, adminToken);
    assert(
      authMeRes.status === 200 &&
        authMeRes.body.success === true &&
        authMeRes.body.data.user.role === 'ADMIN' &&
        Array.isArray(authMeRes.body.data.permissions),
      'TEST 11: Access protected page after successful login',
      `Expected status 200 with user profile and permissions, got ${authMeRes.status}`
    );

    // ----------------------------------------------------
    // TEST 12: Verify password is not stored as plaintext
    // ----------------------------------------------------
    const dbUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(newUserId);
    const isPlaintext = dbUser && dbUser.password_hash === 'StrongPass@2026';
    const isBcrypt = dbUser && (dbUser.password_hash.startsWith('$2a$') || dbUser.password_hash.startsWith('$2b$'));
    assert(
      !isPlaintext && isBcrypt,
      'TEST 12: Verify password is not stored as plaintext',
      `Password hash is plaintext or malformed: ${dbUser ? dbUser.password_hash : 'null'}`
    );

    // ----------------------------------------------------
    // TEST 13: Verify password is not returned through API responses
    // ----------------------------------------------------
    const hasPasswordInReg = 'password_hash' in regRes.body.data.user || 'password' in regRes.body.data.user;
    const hasPasswordInLogin = 'password_hash' in loginRes.body.data.user || 'password' in loginRes.body.data.user;
    const hasPasswordInMe = 'password_hash' in authMeRes.body.data.user || 'password' in authMeRes.body.data.user;
    assert(
      !hasPasswordInReg && !hasPasswordInLogin && !hasPasswordInMe,
      'TEST 13: Verify password is not returned through API responses',
      'Password or password_hash was leaked in API response JSON'
    );

    // ----------------------------------------------------
    // TEST 14: Verify user profile displays the correct authenticated user and supports updates
    // ----------------------------------------------------
    const profileRes = await makeRequest(port, 'GET', '/api/auth/me', undefined, newUserToken);
    const updateRes = await makeRequest(
      port,
      'PUT',
      '/api/auth/profile',
      { full_name: 'Senior Inventory Director' },
      newUserToken
    );
    assert(
      profileRes.status === 200 &&
        profileRes.body.data.user.id === newUserId &&
        profileRes.body.data.user.email === testUserEmail &&
        updateRes.status === 200 &&
        updateRes.body.data.full_name === 'Senior Inventory Director',
      'TEST 14: Verify user profile displays the correct authenticated user and supports updates',
      `Profile check failed: initial email=${profileRes.body && profileRes.body.data && profileRes.body.data.user ? profileRes.body.data.user.email : null}, updated name=${updateRes.body && updateRes.body.data ? updateRes.body.data.full_name : null}`
    );

  } finally {
    server.close();
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n----------------------------------------------------');
  console.log(` SUMMARY: ${passedCount} / ${results.length} TESTS PASSED`);
  console.log('----------------------------------------------------\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
