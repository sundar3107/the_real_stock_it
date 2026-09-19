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
  console.log(' STARTING END-TO-END VERIFICATION SUITE');
  console.log(' MODULE 1: AUTHENTICATION & MODULE 2: PRODUCTS');
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
    // MODULE 1: AUTHENTICATION TESTS (TESTS 1 - 14)
    // ----------------------------------------------------
    console.log('--- MODULE 1: AUTHENTICATION & ACCESS CONTROL ---');

    // TEST 1: Valid login
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

    // TEST 2: Invalid password
    const invalidPassRes = await makeRequest(port, 'POST', '/api/auth/login', {
      email: 'admin@stockit.local',
      password: 'WrongPassword999',
    });
    assert(
      invalidPassRes.status === 401 && invalidPassRes.body.success === false,
      'TEST 2: Invalid password',
      `Expected status 401, got ${invalidPassRes.status}`
    );

    // TEST 3: Invalid email
    const invalidEmailRes = await makeRequest(port, 'POST', '/api/auth/login', {
      email: 'not-an-email-at-all',
      password: 'SomePassword123',
    });
    assert(
      invalidEmailRes.status === 400 && invalidEmailRes.body.errors && invalidEmailRes.body.errors.email,
      'TEST 3: Invalid email',
      `Expected status 400 with email validation error, got ${invalidEmailRes.status}`
    );

    // TEST 4: Empty login fields
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

    // TEST 5: Register valid user (INVENTORY_MANAGER)
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
    const inventoryManagerToken = regRes.body && regRes.body.data ? regRes.body.data.token : null;

    // Register a VIEWER user for testing authorization restrictions
    const viewerEmail = `viewer_${Date.now()}@stockit.local`;
    const viewerRegRes = await makeRequest(port, 'POST', '/api/auth/register', {
      full_name: 'Viewer Auditor',
      email: viewerEmail,
      password: 'ViewerPass@2026',
      confirm_password: 'ViewerPass@2026',
      role: 'VIEWER',
    });
    const viewerToken = viewerRegRes.body?.data?.token;

    // TEST 6: Register duplicate email
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

    // TEST 7: Password and confirm password mismatch
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

    // TEST 8: Invalid role
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

    // TEST 9: Logout
    const logoutRes = await makeRequest(port, 'POST', '/api/auth/logout');
    assert(
      logoutRes.status === 200 && logoutRes.body.success === true,
      'TEST 9: Logout',
      `Expected status 200 confirming logout, got ${logoutRes.status}`
    );

    // TEST 10: Try accessing protected page without authentication
    const unauthRes = await makeRequest(port, 'GET', '/api/auth/me');
    assert(
      unauthRes.status === 401 && unauthRes.body.success === false,
      'TEST 10: Try accessing protected page without authentication',
      `Expected status 401 Unauthorized, got ${unauthRes.status}`
    );

    // TEST 11: Access protected page after successful login
    const authMeRes = await makeRequest(port, 'GET', '/api/auth/me', undefined, adminToken);
    assert(
      authMeRes.status === 200 &&
        authMeRes.body.success === true &&
        authMeRes.body.data.user.role === 'ADMIN' &&
        Array.isArray(authMeRes.body.data.permissions),
      'TEST 11: Access protected page after successful login',
      `Expected status 200 with user profile and permissions, got ${authMeRes.status}`
    );

    // TEST 12: Verify password is not stored as plaintext
    const dbUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(newUserId);
    const isPlaintext = dbUser && dbUser.password_hash === 'StrongPass@2026';
    const isBcrypt = dbUser && (dbUser.password_hash.startsWith('$2a$') || dbUser.password_hash.startsWith('$2b$'));
    assert(
      !isPlaintext && isBcrypt,
      'TEST 12: Verify password is not stored as plaintext',
      `Password hash is plaintext or malformed: ${dbUser ? dbUser.password_hash : 'null'}`
    );

    // TEST 13: Verify password is not returned through API responses
    const hasPasswordInReg = 'password_hash' in regRes.body.data.user || 'password' in regRes.body.data.user;
    const hasPasswordInLogin = 'password_hash' in loginRes.body.data.user || 'password' in loginRes.body.data.user;
    const hasPasswordInMe = 'password_hash' in authMeRes.body.data.user || 'password' in authMeRes.body.data.user;
    assert(
      !hasPasswordInReg && !hasPasswordInLogin && !hasPasswordInMe,
      'TEST 13: Verify password is not returned through API responses',
      'Password or password_hash was leaked in API response JSON'
    );

    // TEST 14: Verify user profile displays the correct authenticated user and supports updates
    const profileRes = await makeRequest(port, 'GET', '/api/auth/me', undefined, inventoryManagerToken);
    const updateRes = await makeRequest(
      port,
      'PUT',
      '/api/auth/profile',
      { full_name: 'Senior Inventory Director' },
      inventoryManagerToken
    );
    assert(
      profileRes.status === 200 &&
        profileRes.body.data.user.id === newUserId &&
        profileRes.body.data.user.email === testUserEmail &&
        updateRes.status === 200 &&
        updateRes.body.data.full_name === 'Senior Inventory Director',
      'TEST 14: Verify user profile displays the correct authenticated user and supports updates',
      `Profile check failed`
    );

    // ----------------------------------------------------
    // MODULE 2: PRODUCT / ITEM MANAGEMENT TESTS (TESTS 15 - 24)
    // ----------------------------------------------------
    console.log('\n--- MODULE 2: PRODUCT & CATEGORY MANAGEMENT ---');

    // TEST 15: Create Category & List Categories
    const testCategoryName = `Peripherals_${Date.now()}`;
    const createCatRes = await makeRequest(
      port,
      'POST',
      '/api/categories',
      { name: testCategoryName, description: 'Keyboards, mice, and accessories' },
      adminToken
    );
    const listCatRes = await makeRequest(port, 'GET', '/api/categories', undefined, adminToken);
    assert(
      createCatRes.status === 201 &&
        createCatRes.body.success === true &&
        createCatRes.body.data.name === testCategoryName &&
        listCatRes.status === 200 &&
        Array.isArray(listCatRes.body.data) &&
        listCatRes.body.data.length >= 6,
      'TEST 15: Create category and list categories',
      `Expected status 201 for creation and 200 for listing, got create=${createCatRes.status}, list=${listCatRes.status}`
    );
    const createdCategoryId = createCatRes.body?.data?.id;

    // TEST 16: Duplicate Category Name Rejection
    const dupCatRes = await makeRequest(
      port,
      'POST',
      '/api/categories',
      { name: testCategoryName, description: 'Duplicate attempt' },
      adminToken
    );
    assert(
      dupCatRes.status === 409 && dupCatRes.body.success === false,
      'TEST 16: Duplicate category name rejection',
      `Expected status 409 Conflict, got ${dupCatRes.status}`
    );

    // TEST 17: Create Product with Valid Category & SKU
    const testSku = `KB-RGB-${Date.now().toString().slice(-4)}`;
    const createProdRes = await makeRequest(
      port,
      'POST',
      '/api/products',
      {
        name: 'Mechanical RGB Keyboard Pro',
        sku: testSku,
        category_id: createdCategoryId,
        description: 'Hot-swappable mechanical keyboard with RGB backlighting',
        unit: 'pcs',
        purchase_price: 1800,
        selling_price: 3200,
        opening_stock: 50,
        reorder_level: 15,
        status: 'ACTIVE',
      },
      inventoryManagerToken
    );
    assert(
      createProdRes.status === 201 &&
        createProdRes.body.success === true &&
        createProdRes.body.data.name === 'Mechanical RGB Keyboard Pro' &&
        createProdRes.body.data.sku === testSku &&
        createProdRes.body.data.current_stock === 50 &&
        createProdRes.body.data.stock_status === 'IN_STOCK',
      'TEST 17: Create valid product with category and SKU',
      `Expected status 201 with stock_status IN_STOCK, got ${createProdRes.status}`
    );
    const createdProductId = createProdRes.body?.data?.id;

    // TEST 18: Reject Duplicate SKU
    const dupSkuRes = await makeRequest(
      port,
      'POST',
      '/api/products',
      {
        name: 'Another Keyboard Model',
        sku: testSku,
        category_id: createdCategoryId,
        purchase_price: 1000,
        selling_price: 2000,
      },
      inventoryManagerToken
    );
    assert(
      dupSkuRes.status === 409 && dupSkuRes.body.success === false,
      'TEST 18: Reject duplicate SKU',
      `Expected status 409 Conflict, got ${dupSkuRes.status}`
    );

    // TEST 19: Reject Negative Prices or Negative Stock
    const negPriceRes = await makeRequest(
      port,
      'POST',
      '/api/products',
      {
        name: 'Negative Price Item',
        sku: `NEG-${Date.now().toString().slice(-4)}`,
        category_id: createdCategoryId,
        purchase_price: -500,
        selling_price: 100,
      },
      inventoryManagerToken
    );
    const negStockRes = await makeRequest(
      port,
      'POST',
      '/api/products',
      {
        name: 'Negative Stock Item',
        sku: `NEGSTK-${Date.now().toString().slice(-4)}`,
        category_id: createdCategoryId,
        purchase_price: 500,
        selling_price: 1000,
        opening_stock: -10,
      },
      inventoryManagerToken
    );
    assert(
      negPriceRes.status === 400 &&
        negPriceRes.body.errors?.purchase_price !== undefined &&
        negStockRes.status === 400 &&
        negStockRes.body.errors?.opening_stock !== undefined,
      'TEST 19: Reject negative prices and negative stock',
      `Expected status 400 validation error, got price=${negPriceRes.status}, stock=${negStockRes.status}`
    );

    // TEST 20: Search Product by Name and SKU
    const searchRes = await makeRequest(
      port,
      'GET',
      `/api/products?search=${testSku}`,
      undefined,
      adminToken
    );
    assert(
      searchRes.status === 200 &&
        searchRes.body.success === true &&
        searchRes.body.data.items.length === 1 &&
        searchRes.body.data.items[0].id === createdProductId,
      'TEST 20: Search product by SKU / Name',
      `Expected 1 matching product for SKU ${testSku}, got ${searchRes.body?.data?.items?.length}`
    );

    // TEST 21: Filter Product by Category and Stock Level
    const filterCatRes = await makeRequest(
      port,
      'GET',
      `/api/products?category_id=${createdCategoryId}&stock_status=IN_STOCK`,
      undefined,
      adminToken
    );
    assert(
      filterCatRes.status === 200 &&
        filterCatRes.body.success === true &&
        filterCatRes.body.data.items.some((p) => p.id === createdProductId),
      'TEST 21: Filter product by category and stock level',
      `Expected filtered results to include product ${createdProductId}`
    );

    // TEST 22: Update Product Attributes (preserving stock boundary)
    const updateProdRes = await makeRequest(
      port,
      'PUT',
      `/api/products/${createdProductId}`,
      {
        name: 'Mechanical RGB Keyboard Pro v2 (Custom Switches)',
        selling_price: 3499.99,
        reorder_level: 20,
      },
      inventoryManagerToken
    );
    assert(
      updateProdRes.status === 200 &&
        updateProdRes.body.success === true &&
        updateProdRes.body.data.name === 'Mechanical RGB Keyboard Pro v2 (Custom Switches)' &&
        updateProdRes.body.data.selling_price === 3499.99 &&
        updateProdRes.body.data.reorder_level === 20 &&
        updateProdRes.body.data.current_stock === 50,
      'TEST 22: Update product attributes (preserving stock boundary)',
      `Expected updated name and price with unchanged current_stock=50, got ${updateProdRes.status}`
    );

    // TEST 23: Soft-deactivate Product
    const deactivateRes = await makeRequest(
      port,
      'DELETE',
      `/api/products/${createdProductId}`,
      undefined,
      inventoryManagerToken
    );
    const getDeactivatedRes = await makeRequest(
      port,
      'GET',
      `/api/products/${createdProductId}`,
      undefined,
      inventoryManagerToken
    );
    assert(
      deactivateRes.status === 200 &&
        deactivateRes.body.success === true &&
        getDeactivatedRes.status === 200 &&
        getDeactivatedRes.body.data.status === 'INACTIVE',
      'TEST 23: Soft-deactivate product',
      `Expected status 200 and product status INACTIVE, got ${deactivateRes.status}, status=${getDeactivatedRes.body?.data?.status}`
    );

    // TEST 24: Role-Based Authorization Enforcement
    const viewerReadRes = await makeRequest(
      port,
      'GET',
      '/api/products',
      undefined,
      viewerToken
    );
    const viewerCreateRes = await makeRequest(
      port,
      'POST',
      '/api/products',
      {
        name: 'Unauthorized Product Creation',
        sku: 'UNAUTH-01',
        category_id: createdCategoryId,
        purchase_price: 100,
        selling_price: 200,
      },
      viewerToken
    );
    assert(
      viewerReadRes.status === 200 && viewerCreateRes.status === 403,
      'TEST 24: Role-based authorization enforcement (VIEWER can read, denied on create)',
      `Expected read=200 and create=403, got read=${viewerReadRes.status}, create=${viewerCreateRes.status}`
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
