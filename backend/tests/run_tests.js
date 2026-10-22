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

    // ----------------------------------------------------
    // MODULE 3: INVENTORY MANAGEMENT TESTS (TESTS 25 - 35)
    // ----------------------------------------------------
    console.log('\n--- MODULE 3: INVENTORY MANAGEMENT & AUDIT LEDGER ---');

    // Create a new dedicated active product for stock testing
    const invProdRes = await makeRequest(
      port,
      'POST',
      '/api/products',
      {
        name: 'Inventory Test Widget',
        sku: `INV-TEST-${Date.now()}`,
        category_id: createdCategoryId,
        unit: 'pcs',
        purchase_price: 150,
        selling_price: 250,
        opening_stock: 40,
        reorder_level: 15,
      },
      inventoryManagerToken
    );
    const testInvProductId = invProdRes.body?.data?.id;

    // TEST 25: Initial Inventory Balance & Metrics
    const metricsRes = await makeRequest(port, 'GET', '/api/inventory/metrics', undefined, inventoryManagerToken);
    const itemStockRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testInvProductId}`,
      undefined,
      inventoryManagerToken
    );
    assert(
      metricsRes.status === 200 &&
        metricsRes.body.success === true &&
        typeof metricsRes.body.data.total_items === 'number' &&
        itemStockRes.status === 200 &&
        itemStockRes.body.data.current_quantity === 40 &&
        itemStockRes.body.data.stock_status === 'IN_STOCK',
      'TEST 25: Initial inventory balance auto-sync & metrics query',
      `Expected 40 stock units and IN_STOCK, got status=${itemStockRes.status}, qty=${itemStockRes.body?.data?.current_quantity}`
    );

    // TEST 26: Valid Stock IN
    const stockInRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/stock-in',
      {
        product_id: testInvProductId,
        quantity: 20,
        reference: 'GRN-2026-001',
        reason: 'Received supplier shipment batch A1',
      },
      inventoryManagerToken
    );
    assert(
      (stockInRes.status === 200 || stockInRes.status === 201) &&
        stockInRes.body.success === true &&
        stockInRes.body.data.inventory.current_quantity === 60 &&
        stockInRes.body.data.transaction.transaction_type === 'STOCK_IN' &&
        stockInRes.body.data.transaction.previous_quantity === 40 &&
        stockInRes.body.data.transaction.new_quantity === 60 &&
        stockInRes.body.data.transaction.quantity === 20,
      'TEST 26: Valid Stock IN (Balance increments 40 -> 60, transaction ledger created)',
      `Expected status 200/201 with new_quantity=60, got ${stockInRes.status}, qty=${stockInRes.body?.data?.inventory?.current_quantity}`
    );

    // TEST 27: Valid Stock OUT
    const stockOutRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/stock-out',
      {
        product_id: testInvProductId,
        quantity: 15,
        reference: 'DISP-2026-001',
        reason: 'Dispatched to branch retail store',
      },
      inventoryManagerToken
    );
    assert(
      stockOutRes.status === 200 &&
        stockOutRes.body.success === true &&
        stockOutRes.body.data.inventory.current_quantity === 45 &&
        stockOutRes.body.data.transaction.transaction_type === 'STOCK_OUT' &&
        stockOutRes.body.data.transaction.previous_quantity === 60 &&
        stockOutRes.body.data.transaction.new_quantity === 45,
      'TEST 27: Valid Stock OUT (Balance decrements 60 -> 45, transaction ledger created)',
      `Expected status 200 with new_quantity=45, got ${stockOutRes.status}, qty=${stockOutRes.body?.data?.inventory?.current_quantity}`
    );

    // TEST 28: Stock OUT rejection on Insufficient Stock
    const overIssueRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/stock-out',
      {
        product_id: testInvProductId,
        quantity: 1000,
        reference: 'DISP-OVER-999',
        reason: 'Attempting to issue more than available',
      },
      inventoryManagerToken
    );
    assert(
      overIssueRes.status === 400 &&
        overIssueRes.body.success === false &&
        overIssueRes.body.message.toLowerCase().includes('insufficient'),
      'TEST 28: Stock OUT rejection on Insufficient Stock (Negative stock prevention)',
      `Expected status 400 with Insufficient stock message, got ${overIssueRes.status}`
    );

    // TEST 29: Stock Adjustment - INCREASE
    const adjustIncRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/adjust',
      {
        product_id: testInvProductId,
        adjustment_type: 'INCREASE',
        quantity: 5,
        reason: 'Physical count found 5 extra units during routine audit',
        reference: 'AUDIT-INC-01',
      },
      inventoryManagerToken
    );
    assert(
      adjustIncRes.status === 200 &&
        adjustIncRes.body.success === true &&
        adjustIncRes.body.data.inventory.current_quantity === 50 &&
        adjustIncRes.body.data.transaction.transaction_type === 'ADJUSTMENT',
      'TEST 29: Stock Adjustment - INCREASE (45 -> 50)',
      `Expected status 200 with new_quantity=50, got ${adjustIncRes.status}`
    );

    // TEST 30: Stock Adjustment - DECREASE
    const adjustDecRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/adjust',
      {
        product_id: testInvProductId,
        adjustment_type: 'DECREASE',
        quantity: 10,
        reason: 'Scrapped 10 units broken in handling',
        reference: 'SCRAP-001',
      },
      inventoryManagerToken
    );
    assert(
      adjustDecRes.status === 200 &&
        adjustDecRes.body.success === true &&
        adjustDecRes.body.data.inventory.current_quantity === 40 &&
        adjustDecRes.body.data.transaction.transaction_type === 'ADJUSTMENT',
      'TEST 30: Stock Adjustment - DECREASE (50 -> 40)',
      `Expected status 200 with new_quantity=40, got ${adjustDecRes.status}`
    );

    // TEST 31: Stock Adjustment - SET_QUANTITY exact count
    const adjustSetRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/adjust',
      {
        product_id: testInvProductId,
        adjustment_type: 'SET_QUANTITY',
        quantity: 12, // Lower than reorder_level (15)
        reason: 'Annual inventory reconciliation absolute count',
        reference: 'RECON-2026',
      },
      inventoryManagerToken
    );
    assert(
      adjustSetRes.status === 200 &&
        adjustSetRes.body.success === true &&
        adjustSetRes.body.data.inventory.current_quantity === 12 &&
        adjustSetRes.body.data.inventory.stock_status === 'LOW_STOCK',
      'TEST 31: Stock Adjustment - SET_QUANTITY (Sets 12, triggers LOW_STOCK status)',
      `Expected status 200 with new_quantity=12 and LOW_STOCK, got qty=${adjustSetRes.body?.data?.inventory?.current_quantity}, status=${adjustSetRes.body?.data?.inventory?.stock_status}`
    );

    // TEST 32: Stock Adjustment validation - Missing mandatory reason rejection
    const missingReasonRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/adjust',
      {
        product_id: testInvProductId,
        adjustment_type: 'INCREASE',
        quantity: 10,
        reason: '   ',
      },
      inventoryManagerToken
    );
    assert(
      missingReasonRes.status === 400 && missingReasonRes.body.errors && missingReasonRes.body.errors.reason,
      'TEST 32: Stock Adjustment validation (Enforces mandatory audit reason)',
      `Expected status 400 with reason validation error, got ${missingReasonRes.status}`
    );

    // TEST 33: Stock Status transitions (Healthy -> Low Stock -> Out of Stock)
    const zeroOutRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/adjust',
      {
        product_id: testInvProductId,
        adjustment_type: 'SET_QUANTITY',
        quantity: 0,
        reason: 'Completely written off for disposal',
      },
      inventoryManagerToken
    );
    assert(
      zeroOutRes.status === 200 &&
        zeroOutRes.body.data.inventory.current_quantity === 0 &&
        zeroOutRes.body.data.inventory.stock_status === 'OUT_OF_STOCK',
      'TEST 33: Stock Status transition to OUT_OF_STOCK on quantity = 0',
      `Expected OUT_OF_STOCK status, got ${zeroOutRes.body?.data?.inventory?.stock_status}`
    );

    // TEST 34: Immutable Transaction Audit Ledger Query
    const transactionsRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/transactions?product_id=${testInvProductId}&limit=20`,
      undefined,
      inventoryManagerToken
    );
    assert(
      transactionsRes.status === 200 &&
        transactionsRes.body.success === true &&
        Array.isArray(transactionsRes.body.data.items) &&
        transactionsRes.body.data.items.length >= 5 &&
        transactionsRes.body.data.items.every((t) => t.product_id === testInvProductId),
      'TEST 34: Immutable Transaction Audit Ledger query with filtering',
      `Expected >= 5 transaction records for product, got ${transactionsRes.body?.data?.items?.length}`
    );

    // TEST 35: Inventory Role-Based Access Control
    const viewerAdjustRes = await makeRequest(
      port,
      'POST',
      '/api/inventory/adjust',
      {
        product_id: testInvProductId,
        adjustment_type: 'INCREASE',
        quantity: 10,
        reason: 'Viewer unauthorized attempt',
      },
      viewerToken
    );
    assert(
      viewerAdjustRes.status === 403,
      'TEST 35: Role-based authorization on Inventory operations (VIEWER forbidden from adjusting stock)',
      `Expected status 403 Forbidden, got ${viewerAdjustRes.status}`
    );

    // ----------------------------------------------------
    // MODULE 4: SUPPLIER MANAGEMENT TESTS (TESTS 36 - 47)
    // ----------------------------------------------------
    console.log('\n--- MODULE 4: SUPPLIER MANAGEMENT ---');

    // Register a PURCHASE_MANAGER user
    const purchaseUserEmail = `purchaser_${Date.now()}@stockit.local`;
    const purchaseRegRes = await makeRequest(port, 'POST', '/api/auth/register', {
      full_name: 'Procurement Officer',
      email: purchaseUserEmail,
      password: 'PurchasePass@2026',
      confirm_password: 'PurchasePass@2026',
      role: 'PURCHASE_MANAGER',
    });
    const purchaseManagerToken = purchaseRegRes.body?.data?.token;

    // TEST 36: List suppliers and metrics query (Initial seed check)
    const supListRes = await makeRequest(port, 'GET', '/api/suppliers', undefined, purchaseManagerToken);
    const supMetricsRes = await makeRequest(port, 'GET', '/api/suppliers/metrics', undefined, purchaseManagerToken);
    assert(
      supListRes.status === 200 &&
        supListRes.body.success === true &&
        Array.isArray(supListRes.body.data.items) &&
        supListRes.body.data.total >= 3 &&
        supMetricsRes.status === 200 &&
        supMetricsRes.body.data.total_suppliers >= 3,
      'TEST 36: List suppliers & metrics query (Seeds loaded)',
      `Expected status 200 with >= 3 suppliers, got total=${supListRes.body?.data?.total}`
    );

    // TEST 37: Create a valid supplier
    const newSupEmail = `vendor_${Date.now()}@zenithenterprises.local`;
    const createSupRes = await makeRequest(
      port,
      'POST',
      '/api/suppliers',
      {
        supplier_name: 'Zenith Components Hub',
        company_name: 'Zenith Logistics & Hardware LLP',
        email: newSupEmail,
        phone: '+91 94455 66778',
        alternate_phone: '+91 94455 66779',
        address: '55 Industrial Corridor, Peenya',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postal_code: '560058',
        tax_number: '29ZZZAA1122B1Z9',
        contact_person: 'Vikram Joshi (Senior VP)',
        notes: 'Primary supplier for mechanical switches and custom plastic chassis.',
        status: 'ACTIVE',
      },
      purchaseManagerToken
    );
    assert(
      createSupRes.status === 201 &&
        createSupRes.body.success === true &&
        createSupRes.body.data.supplier_name === 'Zenith Components Hub' &&
        createSupRes.body.data.status === 'ACTIVE',
      'TEST 37: Create a valid supplier with contact and tax details',
      `Expected status 201 Created, got ${createSupRes.status}`
    );
    const createdSupplierId = createSupRes.body?.data?.id;

    // TEST 38: Required-field validation rejection
    const invalidSupRes = await makeRequest(
      port,
      'POST',
      '/api/suppliers',
      {
        supplier_name: '',
        company_name: '',
        email: 'missingfields@test.local',
        phone: '',
      },
      purchaseManagerToken
    );
    assert(
      invalidSupRes.status === 400 &&
        invalidSupRes.body.errors &&
        invalidSupRes.body.errors.supplier_name &&
        invalidSupRes.body.errors.company_name &&
        invalidSupRes.body.errors.phone,
      'TEST 38: Reject supplier creation with missing required fields',
      `Expected status 400 with field errors, got ${invalidSupRes.status}`
    );

    // TEST 39: Invalid email format rejection
    const invalidEmailSupRes = await makeRequest(
      port,
      'POST',
      '/api/suppliers',
      {
        supplier_name: 'Bad Email Vendor',
        company_name: 'Bad Email Company',
        email: 'not-a-valid-email',
        phone: '+91 98765 00000',
        address: 'Some Address',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '411001',
        contact_person: 'Tester',
      },
      purchaseManagerToken
    );
    assert(
      invalidEmailSupRes.status === 400 &&
        invalidEmailSupRes.body.errors &&
        invalidEmailSupRes.body.errors.email,
      'TEST 39: Reject invalid email format during supplier registration',
      `Expected status 400 with email format error, got ${invalidEmailSupRes.status}`
    );

    // TEST 40: Duplicate supplier email rejection
    const dupSupRes = await makeRequest(
      port,
      'POST',
      '/api/suppliers',
      {
        supplier_name: 'Duplicate Vendor',
        company_name: 'Duplicate Vendor Inc',
        email: newSupEmail, // Duplicate
        phone: '+91 91111 22222',
        address: 'Some Address',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postal_code: '560001',
        contact_person: 'Duplication Tester',
      },
      purchaseManagerToken
    );
    assert(
      dupSupRes.status === 409 && dupSupRes.body.success === false,
      'TEST 40: Reject duplicate supplier email (409 Conflict)',
      `Expected status 409 Conflict, got ${dupSupRes.status}`
    );

    // TEST 41: Edit / update supplier details
    const updateSupRes = await makeRequest(
      port,
      'PUT',
      `/api/suppliers/${createdSupplierId}`,
      {
        supplier_name: 'Zenith Components Hub (Updated)',
        contact_person: 'Vikram Joshi (Executive VP)',
        notes: 'Updated terms: Fast-track 2-day delivery on express orders.',
      },
      purchaseManagerToken
    );
    assert(
      updateSupRes.status === 200 &&
        updateSupRes.body.success === true &&
        updateSupRes.body.data.supplier_name === 'Zenith Components Hub (Updated)' &&
        updateSupRes.body.data.contact_person === 'Vikram Joshi (Executive VP)',
      'TEST 41: Edit / update supplier details',
      `Expected status 200 with updated fields, got ${updateSupRes.status}`
    );

    // TEST 42: Get supplier details by ID
    const getSupDetailsRes = await makeRequest(
      port,
      'GET',
      `/api/suppliers/${createdSupplierId}`,
      undefined,
      purchaseManagerToken
    );
    assert(
      getSupDetailsRes.status === 200 &&
        getSupDetailsRes.body.success === true &&
        getSupDetailsRes.body.data.id === createdSupplierId &&
        Array.isArray(getSupDetailsRes.body.data.products) &&
        Array.isArray(getSupDetailsRes.body.data.purchase_history),
      'TEST 42: Get supplier details by ID (with products & future placeholder)',
      `Expected status 200 with supplier details, got ${getSupDetailsRes.status}`
    );

    // TEST 43: Search suppliers
    const searchSupRes = await makeRequest(
      port,
      'GET',
      '/api/suppliers?search=Zenith',
      undefined,
      purchaseManagerToken
    );
    assert(
      searchSupRes.status === 200 &&
        searchSupRes.body.data.items.length >= 1 &&
        searchSupRes.body.data.items.some((s) => s.id === createdSupplierId),
      'TEST 43: Search suppliers by query string',
      `Expected search to find created supplier, got count=${searchSupRes.body?.data?.items?.length}`
    );

    // TEST 44: Filter suppliers by status
    const filterActiveRes = await makeRequest(
      port,
      'GET',
      '/api/suppliers?status=ACTIVE',
      undefined,
      purchaseManagerToken
    );
    assert(
      filterActiveRes.status === 200 &&
        filterActiveRes.body.data.items.every((s) => s.status === 'ACTIVE'),
      'TEST 44: Filter suppliers by status=ACTIVE',
      `Expected all items to have ACTIVE status, got status=${filterActiveRes.status}`
    );

    // TEST 45: Activate / Deactivate supplier (Soft-deactivation)
    const deactSupRes = await makeRequest(
      port,
      'PATCH',
      `/api/suppliers/${createdSupplierId}/status`,
      { status: 'INACTIVE' },
      purchaseManagerToken
    );
    const getDeactSupRes = await makeRequest(
      port,
      'GET',
      `/api/suppliers/${createdSupplierId}`,
      undefined,
      purchaseManagerToken
    );
    assert(
      deactSupRes.status === 200 &&
        getDeactSupRes.status === 200 &&
        getDeactSupRes.body.data.status === 'INACTIVE',
      'TEST 45: Soft-deactivate supplier (Active -> Inactive)',
      `Expected status INACTIVE, got ${getDeactSupRes.body?.data?.status}`
    );

    // Reactivate for relationship test
    await makeRequest(
      port,
      'PATCH',
      `/api/suppliers/${createdSupplierId}/status`,
      { status: 'ACTIVE' },
      purchaseManagerToken
    );

    // TEST 46: Associate product with supplier
    const associateRes = await makeRequest(
      port,
      'POST',
      `/api/suppliers/${createdSupplierId}/products`,
      { product_ids: [testInvProductId] },
      purchaseManagerToken
    );
    const supProductsRes = await makeRequest(
      port,
      'GET',
      `/api/suppliers/${createdSupplierId}/products`,
      undefined,
      purchaseManagerToken
    );
    assert(
      associateRes.status === 200 &&
        associateRes.body.success === true &&
        supProductsRes.status === 200 &&
        supProductsRes.body.data.some((p) => p.product_id === testInvProductId),
      'TEST 46: Associate product with supplier and retrieve linked products',
      `Expected product linked to supplier, got count=${supProductsRes.body?.data?.length}`
    );

    // TEST 47: Disassociate product from supplier
    const disassociateRes = await makeRequest(
      port,
      'DELETE',
      `/api/suppliers/${createdSupplierId}/products/${testInvProductId}`,
      undefined,
      purchaseManagerToken
    );
    const supProductsAfterRes = await makeRequest(
      port,
      'GET',
      `/api/suppliers/${createdSupplierId}/products`,
      undefined,
      purchaseManagerToken
    );
    assert(
      disassociateRes.status === 200 &&
        disassociateRes.body.success === true &&
        supProductsAfterRes.status === 200 &&
        !supProductsAfterRes.body.data.some((p) => p.product_id === testInvProductId),
      'TEST 47: Disassociate product from supplier',
      `Expected product removed from supplier, got count=${supProductsAfterRes.body?.data?.length}`
    );

    // TEST 48: Role-based authorization on Suppliers
    const viewerCreateSupRes = await makeRequest(
      port,
      'POST',
      '/api/suppliers',
      {
        supplier_name: 'Unauthorized Supplier',
        company_name: 'Unauthorized Inc',
        email: 'unauth@supplier.local',
        phone: '+91 99999 88888',
        address: 'No Address',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postal_code: '110001',
        contact_person: 'Unauthorized Person',
      },
      viewerToken
    );
    assert(
      viewerCreateSupRes.status === 403,
      'TEST 48: Role-based authorization (VIEWER is forbidden from creating/modifying suppliers)',
      `Expected status 403 Forbidden, got ${viewerCreateSupRes.status}`
    );

  
    // ----------------------------------------------------
    // MODULE 5: CUSTOMER MANAGEMENT TESTS (TESTS 49 - 59)
    // ----------------------------------------------------
    console.log('\n--- MODULE 5: CUSTOMER MANAGEMENT ---');

    // Register a SALES_MANAGER user
    const salesUserEmail = `sales_${Date.now()}@stockit.local`;
    const salesRegRes = await makeRequest(port, 'POST', '/api/auth/register', {
      full_name: 'Sales Director',
      email: salesUserEmail,
      password: 'SalesPass@2026',
      confirm_password: 'SalesPass@2026',
      role: 'SALES_MANAGER',
    });
    const salesManagerToken = salesRegRes.body?.data?.token;

    // TEST 49: List customers and metrics query (Initial seed check)
    const custListRes = await makeRequest(port, 'GET', '/api/customers', undefined, salesManagerToken);
    const custMetricsRes = await makeRequest(port, 'GET', '/api/customers/metrics', undefined, salesManagerToken);
    assert(
      custListRes.status === 200 &&
        custListRes.body.success === true &&
        Array.isArray(custListRes.body.data.items) &&
        custListRes.body.data.items.length >= 3 &&
        custMetricsRes.status === 200 &&
        custMetricsRes.body.data.total_customers >= 3,
      'TEST 49: List customers & metrics query (Seeds loaded)',
      `Expected status 200 with >=3 seeded customers, got ${custListRes.status}, count=${custListRes.body?.data?.items?.length}`
    );

    // TEST 50: Create a valid customer with contact and address details
    const newCustEmail = `test.client_${Date.now()}@apexcorp.local`;
    const createCustRes = await makeRequest(
      port,
      'POST',
      '/api/customers',
      {
        customer_name: 'Arjun Mehta',
        company_name: 'Mehta Enterprise Logistics',
        email: newCustEmail,
        phone: '+91 98200 11223',
        alternate_phone: '+91 98200 11224',
        address: '502 Business Bay, Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400013',
        tax_number: '27AABCM1122M1Z3',
        notes: 'Priority corporate customer. Net 30 payment terms.',
        status: 'ACTIVE',
      },
      salesManagerToken
    );
    const createdCustomerId = createCustRes.body?.data?.id;
    assert(
      createCustRes.status === 201 &&
        createCustRes.body.success === true &&
        createdCustomerId &&
        createdCustomerId.startsWith('cust_') &&
        createCustRes.body.data.customer_name === 'Arjun Mehta' &&
        createCustRes.body.data.status === 'ACTIVE',
      'TEST 50: Add valid customer with contact and location details',
      `Expected status 201 with customer object, got ${createCustRes.status}`
    );

    // TEST 51: Reject customer creation with missing required fields
    const missingCustRes = await makeRequest(
      port,
      'POST',
      '/api/customers',
      {
        customer_name: '',
        company_name: '',
        email: '',
      },
      salesManagerToken
    );
    assert(
      missingCustRes.status === 400 &&
        missingCustRes.body.success === false &&
        missingCustRes.body.errors,
      'TEST 51: Validation check: reject missing required fields',
      `Expected status 400 with validation errors, got ${missingCustRes.status}`
    );

    // TEST 52: Reject invalid email format during customer registration
    const invalidEmailCustRes = await makeRequest(
      port,
      'POST',
      '/api/customers',
      {
        customer_name: 'Faulty Email User',
        email: 'invalid-email-address-format',
        phone: '+91 98765 43210',
        address: '100 Main St',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '411001',
      },
      salesManagerToken
    );
    assert(
      invalidEmailCustRes.status === 400 &&
        invalidEmailCustRes.body.errors &&
        invalidEmailCustRes.body.errors.email,
      'TEST 52: Validation check: reject invalid email format',
      `Expected status 400 with email validation error, got ${invalidEmailCustRes.status}`
    );

    // TEST 53: Duplicate customer email rejection (409 Conflict)
    const dupCustRes = await makeRequest(
      port,
      'POST',
      '/api/customers',
      {
        customer_name: 'Duplicate Client',
        email: newCustEmail,
        phone: '+91 98888 77777',
        address: 'Another Address',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400001',
      },
      salesManagerToken
    );
    assert(
      dupCustRes.status === 409 && dupCustRes.body.success === false,
      'TEST 53: Duplicate handling: reject duplicate customer email (409 Conflict)',
      `Expected status 409 Conflict, got ${dupCustRes.status}`
    );

    // TEST 54: Edit / update customer details
    const updateCustRes = await makeRequest(
      port,
      'PUT',
      `/api/customers/${createdCustomerId}`,
      {
        customer_name: 'Arjun Mehta (VP Operations)',
        notes: 'Updated credit limit: ₹500,000 upon contract renewal.',
      },
      salesManagerToken
    );
    assert(
      updateCustRes.status === 200 &&
        updateCustRes.body.success === true &&
        updateCustRes.body.data.customer_name === 'Arjun Mehta (VP Operations)' &&
        updateCustRes.body.data.notes === 'Updated credit limit: ₹500,000 upon contract renewal.',
      'TEST 54: Edit / update customer details',
      `Expected status 200 with updated fields, got ${updateCustRes.status}`
    );

    // TEST 55: View customer details by ID (with future module placeholders)
    const getCustDetailsRes = await makeRequest(
      port,
      'GET',
      `/api/customers/${createdCustomerId}`,
      undefined,
      salesManagerToken
    );
    assert(
      getCustDetailsRes.status === 200 &&
        getCustDetailsRes.body.success === true &&
        getCustDetailsRes.body.data.id === createdCustomerId &&
        Array.isArray(getCustDetailsRes.body.data.sales_history) &&
        Array.isArray(getCustDetailsRes.body.data.orders) &&
        Array.isArray(getCustDetailsRes.body.data.invoices),
      'TEST 55: View customer details by ID (with future sales/orders/invoices placeholders)',
      `Expected status 200 with customer detail placeholders, got ${getCustDetailsRes.status}`
    );

    // TEST 56: Search customers by query string
    const searchCustRes = await makeRequest(
      port,
      'GET',
      '/api/customers?search=Mehta',
      undefined,
      salesManagerToken
    );
    assert(
      searchCustRes.status === 200 &&
        searchCustRes.body.data.items.length >= 1 &&
        searchCustRes.body.data.items.some((c) => c.id === createdCustomerId),
      'TEST 56: Search customers by query string',
      `Expected search to find created customer, got count=${searchCustRes.body?.data?.items?.length}`
    );

    // TEST 57: Filter customers by status=ACTIVE and city
    const filterActiveCustRes = await makeRequest(
      port,
      'GET',
      '/api/customers?status=ACTIVE&city=Mumbai',
      undefined,
      salesManagerToken
    );
    assert(
      filterActiveCustRes.status === 200 &&
        filterActiveCustRes.body.data.items.every((c) => c.status === 'ACTIVE' && c.city.toLowerCase().includes('mumbai')),
      'TEST 57: Filter customers by status=ACTIVE and city',
      `Expected all filtered items to match ACTIVE status and city Mumbai, got status=${filterActiveCustRes.status}`
    );

    // TEST 58: Soft-deactivate customer (ACTIVE -> INACTIVE)
    const deactCustRes = await makeRequest(
      port,
      'PATCH',
      `/api/customers/${createdCustomerId}/status`,
      { status: 'INACTIVE' },
      salesManagerToken
    );
    const getDeactCustRes = await makeRequest(
      port,
      'GET',
      `/api/customers/${createdCustomerId}`,
      undefined,
      salesManagerToken
    );
    assert(
      deactCustRes.status === 200 &&
        getDeactCustRes.status === 200 &&
        getDeactCustRes.body.data.status === 'INACTIVE',
      'TEST 58: Soft-deactivate customer (Active -> Inactive)',
      `Expected status INACTIVE, got ${getDeactCustRes.body?.data?.status}`
    );

    // TEST 59: Role-based authorization on Customers (VIEWER cannot create, but CAN read)
    const viewerCreateCustRes = await makeRequest(
      port,
      'POST',
      '/api/customers',
      {
        customer_name: 'Unauthorized Customer Attempt',
        email: 'unauth@client.local',
        phone: '+91 99999 00000',
        address: 'No Address',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postal_code: '110001',
      },
      viewerToken
    );
    const viewerReadCustRes = await makeRequest(
      port,
      'GET',
      '/api/customers',
      undefined,
      viewerToken
    );
    assert(
      viewerCreateCustRes.status === 403 && viewerReadCustRes.status === 200,
      'TEST 59: Role-based authorization (VIEWER is forbidden from creating/editing, but can read)',
      `Expected create=403, read=200, got create=${viewerCreateCustRes.status}, read=${viewerReadCustRes.status}`
    );

    // ----------------------------------------------------
    // MODULE 6: PURCHASE MANAGEMENT TESTS (TESTS 60 - 71)
    // ----------------------------------------------------
    console.log('\n--- MODULE 6: PURCHASE MANAGEMENT ---');

    // TEST 60: List purchase orders and metrics query (Initial seed check)
    const poListRes = await makeRequest(port, 'GET', '/api/purchases', undefined, purchaseManagerToken);
    const poMetricsRes = await makeRequest(port, 'GET', '/api/purchases/metrics', undefined, purchaseManagerToken);
    assert(
      poListRes.status === 200 &&
        poListRes.body.success === true &&
        Array.isArray(poListRes.body.data.items) &&
        poListRes.body.data.total >= 1 &&
        poMetricsRes.status === 200 &&
        poMetricsRes.body.data.total_orders >= 1,
      'TEST 60: List purchase orders & metrics query (Seeds loaded)',
      `Expected status 200 with at least 1 PO, got count=${poListRes.body?.data?.total}, metrics=${JSON.stringify(poMetricsRes.body?.data)}`
    );

    // Find active supplier and active product for PO tests
    const activeSuppliers = supListRes.body.data.items.filter((s) => s.status === 'ACTIVE');
    const testSupplierId = activeSuppliers[0]?.id || 'sup_prime_tech';
    const productsRes = await makeRequest(port, 'GET', '/api/products', undefined, purchaseManagerToken);
    const activeProducts = productsRes.body.data.items.filter((p) => p.status === 'ACTIVE');
    const testPoProductId = activeProducts[0]?.id || testInvProductId;

    // TEST 61: Create a valid purchase order (Status: DRAFT)
    const createPoRes = await makeRequest(
      port,
      'POST',
      '/api/purchases',
      {
        supplier_id: testSupplierId,
        order_date: '2026-11-01',
        expected_delivery_date: '2026-11-15',
        status: 'DRAFT',
        notes: 'Urgent restocking order for upcoming peak season.',
        items: [
          {
            product_id: testPoProductId,
            quantity: 30,
            unit_price: 120.0,
            tax: 50.0,
            discount: 20.0,
          },
        ],
      },
      purchaseManagerToken
    );
    const createdPoId = createPoRes.body?.data?.id;
    const createdPoItemId = createPoRes.body?.data?.items?.[0]?.id;
    assert(
      createPoRes.status === 201 &&
        createPoRes.body.success === true &&
        createdPoId &&
        createPoRes.body.data.status === 'DRAFT' &&
        createPoRes.body.data.subtotal === 3630.0 &&
        createPoRes.body.data.total === 3630.0,
      'TEST 61: Create a valid purchase order with active supplier and line items',
      `Expected status 201 with DRAFT status and total=3630, got status=${createPoRes.status}, data=${JSON.stringify(createPoRes.body?.data)}`
    );

    // TEST 62: Reject purchase order creation with missing required fields or non-existent supplier
    const invalidSupPoRes = await makeRequest(
      port,
      'POST',
      '/api/purchases',
      {
        supplier_id: 'sup_non_existent_99999',
        order_date: '2026-11-01',
        items: [{ product_id: testPoProductId, quantity: 10, unit_price: 50 }],
      },
      purchaseManagerToken
    );
    const missingFieldsPoRes = await makeRequest(
      port,
      'POST',
      '/api/purchases',
      {
        supplier_id: '',
        order_date: '',
        items: [],
      },
      purchaseManagerToken
    );
    assert(
      (invalidSupPoRes.status === 400 || invalidSupPoRes.status === 404) && missingFieldsPoRes.status === 400,
      'TEST 62: Reject purchase order creation with missing fields or non-existent supplier',
      `Expected status 400/404, got invalidSup=${invalidSupPoRes.status}, missingFields=${missingFieldsPoRes.status}`
    );

    // TEST 63: Reject purchase order with quantity <= 0 or empty line items
    const zeroQtyPoRes = await makeRequest(
      port,
      'POST',
      '/api/purchases',
      {
        supplier_id: testSupplierId,
        order_date: '2026-11-01',
        items: [
          {
            product_id: testPoProductId,
            quantity: 0,
            unit_price: 100,
          },
        ],
      },
      purchaseManagerToken
    );
    assert(
      zeroQtyPoRes.status === 400 && zeroQtyPoRes.body.errors,
      'TEST 63: Reject purchase order with quantity <= 0 or empty line items',
      `Expected status 400 with quantity validation error, got ${zeroQtyPoRes.status}`
    );

    // TEST 64: Update purchase order details while in DRAFT status
    const updateDraftPoRes = await makeRequest(
      port,
      'PUT',
      `/api/purchases/${createdPoId}`,
      {
        notes: 'Updated restocking instructions: fragile packaging required.',
        expected_delivery_date: '2026-11-20',
      },
      purchaseManagerToken
    );
    assert(
      updateDraftPoRes.status === 200 &&
        updateDraftPoRes.body.success === true &&
        updateDraftPoRes.body.data.notes === 'Updated restocking instructions: fragile packaging required.' &&
        updateDraftPoRes.body.data.expected_delivery_date === '2026-11-20',
      'TEST 64: Update purchase order details while in DRAFT status',
      `Expected status 200 with updated fields, got ${updateDraftPoRes.status}`
    );

    // TEST 65: Status transition: DRAFT -> ORDERED
    const submitPoRes = await makeRequest(
      port,
      'PATCH',
      `/api/purchases/${createdPoId}/status`,
      { status: 'ORDERED' },
      purchaseManagerToken
    );
    assert(
      submitPoRes.status === 200 && submitPoRes.body.data.status === 'ORDERED',
      'TEST 65: Status transition: DRAFT -> ORDERED',
      `Expected status 200 with ORDERED status, got ${submitPoRes.body?.data?.status}`
    );

    // Get current inventory balance before receiving
    const invBeforeRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testPoProductId}`,
      undefined,
      inventoryManagerToken
    );
    const currentQtyBefore = invBeforeRes.body?.data?.current_quantity ?? 0;

    // TEST 66: Receive products (Partial receipt) & verify authoritative inventory stock IN
    const partialReceiveRes = await makeRequest(
      port,
      'POST',
      `/api/purchases/${createdPoId}/receive`,
      {
        items: [
          {
            item_id: createdPoItemId,
            receive_quantity: 12,
          },
        ],
        notes: 'Inbound shipment part 1 - arrived in good condition',
      },
      inventoryManagerToken
    );
    // Verify inventory balance increased by exactly 12 units
    const invAfterPartialRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testPoProductId}`,
      undefined,
      inventoryManagerToken
    );
    const currentQtyAfterPartial = invAfterPartialRes.body?.data?.current_quantity ?? 0;

    assert(
      partialReceiveRes.status === 200 &&
        partialReceiveRes.body.success === true &&
        partialReceiveRes.body.data.purchase_order.status === 'PARTIALLY_RECEIVED' &&
        partialReceiveRes.body.data.purchase_order.items[0].received_quantity === 12 &&
        currentQtyAfterPartial === currentQtyBefore + 12,
      'TEST 66: Receive products (Partial receipt) & verify authoritative inventory stock IN',
      `Expected status 200, PO status=PARTIALLY_RECEIVED, received_qty=12, inventory before=${currentQtyBefore}, after=${currentQtyAfterPartial}`
    );

    // TEST 67: Receive remaining products (Full receipt)
    const fullReceiveRes = await makeRequest(
      port,
      'POST',
      `/api/purchases/${createdPoId}/receive`,
      {
        items: [
          {
            item_id: createdPoItemId,
            receive_quantity: 18, // Remaining 18 out of 30
          },
        ],
        notes: 'Inbound shipment part 2 - final delivery',
      },
      inventoryManagerToken
    );
    const invAfterFullRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testPoProductId}`,
      undefined,
      inventoryManagerToken
    );
    const currentQtyAfterFull = invAfterFullRes.body?.data?.current_quantity ?? 0;

    assert(
      fullReceiveRes.status === 200 &&
        fullReceiveRes.body.success === true &&
        fullReceiveRes.body.data.purchase_order.status === 'RECEIVED' &&
        fullReceiveRes.body.data.purchase_order.items[0].received_quantity === 30 &&
        currentQtyAfterFull === currentQtyAfterPartial + 18,
      'TEST 67: Receive remaining products (Full receipt)',
      `Expected status 200, PO status=RECEIVED, received_qty=30, inventory after=${currentQtyAfterFull}`
    );

    // TEST 68: Reject receiving excess quantity beyond ordered remaining
    const excessReceiveRes = await makeRequest(
      port,
      'POST',
      `/api/purchases/${createdPoId}/receive`,
      {
        items: [
          {
            item_id: createdPoItemId,
            receive_quantity: 5,
          },
        ],
      },
      inventoryManagerToken
    );
    assert(
      excessReceiveRes.status === 400 && excessReceiveRes.body.success === false,
      'TEST 68: Reject receiving excess quantity beyond ordered remaining',
      `Expected status 400 on excess receive, got ${excessReceiveRes.status}`
    );

    // TEST 69: Reject status transition to CANCELLED once products have already been received
    const cancelReceivedPoRes = await makeRequest(
      port,
      'PATCH',
      `/api/purchases/${createdPoId}/status`,
      { status: 'CANCELLED' },
      purchaseManagerToken
    );
    assert(
      cancelReceivedPoRes.status === 400 && cancelReceivedPoRes.body.success === false,
      'TEST 69: Reject status transition to CANCELLED once items have been received',
      `Expected status 400 rejecting cancellation of received order, got ${cancelReceivedPoRes.status}`
    );

    // TEST 70: Search & filter purchase orders by status, supplier, search query
    const filterReceivedPoRes = await makeRequest(
      port,
      'GET',
      '/api/purchases?status=RECEIVED',
      undefined,
      purchaseManagerToken
    );
    const searchPoRes = await makeRequest(
      port,
      'GET',
      `/api/purchases?search=${createdPoId}`,
      undefined,
      purchaseManagerToken
    );
    assert(
      filterReceivedPoRes.status === 200 &&
        filterReceivedPoRes.body.data.items.every((po) => po.status === 'RECEIVED') &&
        searchPoRes.status === 200 &&
        searchPoRes.body.data.items.some((po) => po.id === createdPoId),
      'TEST 70: Search & filter purchase orders by status, supplier, search query',
      `Expected search to find created PO and filter to match status=RECEIVED, got status=${filterReceivedPoRes.status}`
    );

    // TEST 71: Role-based authorization on Purchase operations
    const viewerCreatePoRes = await makeRequest(
      port,
      'POST',
      '/api/purchases',
      {
        supplier_id: testSupplierId,
        order_date: '2026-11-01',
        items: [{ product_id: testPoProductId, quantity: 10, unit_price: 50 }],
      },
      viewerToken
    );
    const viewerReceivePoRes = await makeRequest(
      port,
      'POST',
      `/api/purchases/${createdPoId}/receive`,
      {
        items: [{ item_id: createdPoItemId, receive_quantity: 1 }],
      },
      viewerToken
    );
    const viewerReadPoRes = await makeRequest(
      port,
      'GET',
      '/api/purchases',
      undefined,
      viewerToken
    );
    assert(
      viewerCreatePoRes.status === 403 &&
        viewerReceivePoRes.status === 403 &&
        viewerReadPoRes.status === 200,
      'TEST 71: Role-based authorization (VIEWER is forbidden from creating/receiving, but can read)',
      `Expected create=403, receive=403, read=200, got create=${viewerCreatePoRes.status}, receive=${viewerReceivePoRes.status}, read=${viewerReadPoRes.status}`
    );

    // ----------------------------------------------------
    // MODULE 7: SALES MANAGEMENT TESTS (TESTS 72 - 83)
    // ----------------------------------------------------
    console.log('\n--- MODULE 7: SALES MANAGEMENT ---');

    // TEST 72: List sales orders & metrics query (Seeds loaded)
    const soListRes = await makeRequest(port, 'GET', '/api/sales', undefined, salesManagerToken);
    const soMetricsRes = await makeRequest(port, 'GET', '/api/sales/metrics', undefined, salesManagerToken);
    assert(
      soListRes.status === 200 &&
        soListRes.body.success === true &&
        Array.isArray(soListRes.body.data.items) &&
        soListRes.body.data.total >= 1 &&
        soMetricsRes.status === 200 &&
        soMetricsRes.body.data.total_orders >= 1,
      'TEST 72: List sales orders & metrics query (Seeds loaded)',
      `Expected status 200 with at least 1 sales order, got count=${soListRes.body?.data?.total}`
    );

    // Create an active customer specifically for sales testing
    const activeCustRes = await makeRequest(
      port,
      'POST',
      '/api/customers',
      {
        customer_name: 'Apex Retail Enterprises',
        company_name: 'Apex Retail Ltd',
        email: `apex_sales_${Date.now()}@apexretail.local`,
        phone: '+91 98111 22233',
        address: '500 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postal_code: '560001',
      },
      salesManagerToken
    );
    const testSalesCustomerId = activeCustRes.body?.data?.id;

    // TEST 73: Create a sales order as DRAFT with line items and financial calculation
    const createSoRes = await makeRequest(
      port,
      'POST',
      '/api/sales',
      {
        customer_id: testSalesCustomerId,
        order_date: '2026-11-05',
        status: 'DRAFT',
        notes: 'Customer retail order with standard courier delivery.',
        items: [
          {
            product_id: testPoProductId,
            quantity: 4,
            unit_price: 200.0,
            tax: 20.0,
            discount: 10.0,
          },
        ],
      },
      salesManagerToken
    );
    const createdSoId = createSoRes.body?.data?.id;
    const createdSoNumber = createSoRes.body?.data?.order_number;
    assert(
      createSoRes.status === 201 &&
        createSoRes.body.success === true &&
        createdSoId &&
        createSoRes.body.data.status === 'DRAFT' &&
        createdSoNumber &&
        createdSoNumber.startsWith('SO-') &&
        createSoRes.body.data.subtotal === 810.0 &&
        createSoRes.body.data.total === 810.0,
      'TEST 73: Create a sales order as DRAFT with line items and financial calculation',
      `Expected status 201 with DRAFT status and total=810, got status=${createSoRes.status}, data=${JSON.stringify(createSoRes.body?.data)}`
    );

    // TEST 74: Validation check: reject sales order with missing fields or inactive customer
    const missingCustSoRes = await makeRequest(
      port,
      'POST',
      '/api/sales',
      {
        customer_id: '',
        items: [{ product_id: testPoProductId, quantity: 2, unit_price: 150 }],
      },
      salesManagerToken
    );
    // createdCustomerId was deactivated to INACTIVE in TEST 58
    const inactiveCustSoRes = await makeRequest(
      port,
      'POST',
      '/api/sales',
      {
        customer_id: createdCustomerId,
        items: [{ product_id: testPoProductId, quantity: 2, unit_price: 150 }],
      },
      salesManagerToken
    );
    assert(
      missingCustSoRes.status === 400 &&
        inactiveCustSoRes.status === 400 &&
        inactiveCustSoRes.body.message.includes('inactive customer'),
      'TEST 74: Validation check: reject sales order with missing fields or inactive customer',
      `Expected status 400 for both, got missing=${missingCustSoRes.status}, inactive=${inactiveCustSoRes.status}`
    );

    // TEST 75: Validation check: reject sales order with quantity <= 0 or empty line items
    const emptyItemsSoRes = await makeRequest(
      port,
      'POST',
      '/api/sales',
      {
        customer_id: testSalesCustomerId,
        items: [],
      },
      salesManagerToken
    );
    const zeroQtySoRes = await makeRequest(
      port,
      'POST',
      '/api/sales',
      {
        customer_id: testSalesCustomerId,
        items: [{ product_id: testPoProductId, quantity: 0, unit_price: 100 }],
      },
      salesManagerToken
    );
    assert(
      emptyItemsSoRes.status === 400 && zeroQtySoRes.status === 400,
      'TEST 75: Validation check: reject sales order with quantity <= 0 or empty line items',
      `Expected status 400, got emptyItems=${emptyItemsSoRes.status}, zeroQty=${zeroQtySoRes.status}`
    );

    // TEST 76: Update sales order details while in DRAFT status
    const updateDraftSoRes = await makeRequest(
      port,
      'PUT',
      `/api/sales/${createdSoId}`,
      {
        notes: 'Priority express dispatch requested by customer.',
        items: [
          {
            product_id: testPoProductId,
            quantity: 5,
            unit_price: 200.0,
            tax: 25.0,
            discount: 15.0,
          },
        ],
      },
      salesManagerToken
    );
    assert(
      updateDraftSoRes.status === 200 &&
        updateDraftSoRes.body.success === true &&
        updateDraftSoRes.body.data.notes === 'Priority express dispatch requested by customer.' &&
        updateDraftSoRes.body.data.items[0].quantity === 5 &&
        updateDraftSoRes.body.data.total === 1010.0, // 5*200 + 25 - 15 = 1010
      'TEST 76: Update sales order details while in DRAFT status',
      `Expected status 200 with updated fields and total=1010, got ${updateDraftSoRes.status}`
    );

    // TEST 77: Status transition: DRAFT -> CONFIRMED
    const confirmSoRes = await makeRequest(
      port,
      'PATCH',
      `/api/sales/${createdSoId}/status`,
      { status: 'CONFIRMED' },
      salesManagerToken
    );
    assert(
      confirmSoRes.status === 200 && confirmSoRes.body.data.status === 'CONFIRMED',
      'TEST 77: Status transition: DRAFT -> CONFIRMED',
      `Expected status 200 with CONFIRMED status, got ${confirmSoRes.body?.data?.status}`
    );

    // TEST 78: Stock Validation: Reject sale completion when requested quantity exceeds available stock
    const excessSoRes = await makeRequest(
      port,
      'POST',
      '/api/sales',
      {
        customer_id: testSalesCustomerId,
        status: 'CONFIRMED',
        items: [{ product_id: testPoProductId, quantity: 999999, unit_price: 50 }],
      },
      salesManagerToken
    );
    const excessSoId = excessSoRes.body?.data?.id;
    const excessCompleteRes = await makeRequest(
      port,
      'POST',
      `/api/sales/${excessSoId}/complete`,
      {},
      salesManagerToken
    );
    assert(
      excessCompleteRes.status === 400 &&
        excessCompleteRes.body.success === false &&
        excessCompleteRes.body.message.includes('Insufficient stock'),
      'TEST 78: Stock Validation: Reject sale completion when requested quantity exceeds available stock',
      `Expected status 400 with Insufficient stock message, got ${excessCompleteRes.status}`
    );

    // TEST 79: Complete sale (Stock OUT fulfillment): verify physical inventory balance deduction
    const invBeforeSaleRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testPoProductId}`,
      undefined,
      inventoryManagerToken
    );
    const invQtyBeforeSale = invBeforeSaleRes.body?.data?.current_quantity ?? 0;

    const completeSaleRes = await makeRequest(
      port,
      'POST',
      `/api/sales/${createdSoId}/complete`,
      {},
      salesManagerToken
    );

    const invAfterSaleRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testPoProductId}`,
      undefined,
      inventoryManagerToken
    );
    const invQtyAfterSale = invAfterSaleRes.body?.data?.current_quantity ?? 0;

    assert(
      completeSaleRes.status === 200 &&
        completeSaleRes.body.success === true &&
        completeSaleRes.body.data.status === 'COMPLETED' &&
        invQtyAfterSale === invQtyBeforeSale - 5,
      'TEST 79: Complete sale (Stock OUT fulfillment): verify physical inventory balance deduction',
      `Expected status 200, status=COMPLETED, inventory before=${invQtyBeforeSale}, after=${invQtyAfterSale} (expected decrement of 5)`
    );

    // TEST 80: Verify immutable stock transaction audit ledger created with Sales Order reference
    const salesTxRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/transactions?product_id=${testPoProductId}&limit=10`,
      undefined,
      inventoryManagerToken
    );
    const hasSoStockOutTx =
      salesTxRes.status === 200 &&
      salesTxRes.body.data.items.some(
        (t) =>
          t.transaction_type === 'STOCK_OUT' &&
          t.quantity === 5 &&
          t.reference &&
          t.reference.includes(`SO #${createdSoNumber}`)
      );
    assert(
      hasSoStockOutTx,
      'TEST 80: Verify immutable stock transaction audit ledger created with Sales Order reference',
      `Expected STOCK_OUT transaction referencing SO #${createdSoNumber}, got transactions=${JSON.stringify(salesTxRes.body?.data?.items?.slice(0, 3))}`
    );

    // TEST 81: Idempotency check: Cannot complete sale twice (prevents double stock deduction)
    const doubleCompleteRes = await makeRequest(
      port,
      'POST',
      `/api/sales/${createdSoId}/complete`,
      {},
      salesManagerToken
    );
    const invAfterDoubleRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testPoProductId}`,
      undefined,
      inventoryManagerToken
    );
    const invQtyAfterDouble = invAfterDoubleRes.body?.data?.current_quantity ?? 0;

    assert(
      doubleCompleteRes.status === 400 &&
        doubleCompleteRes.body.success === false &&
        doubleCompleteRes.body.message.includes('already completed') &&
        invQtyAfterDouble === invQtyAfterSale,
      'TEST 81: Idempotency check: Cannot complete sale twice (prevents double stock deduction)',
      `Expected status 400 rejecting duplicate completion and unchanged inventory, got status=${doubleCompleteRes.status}`
    );

    // TEST 82: Cancelled order cannot be completed
    const draftForCancelRes = await makeRequest(
      port,
      'POST',
      '/api/sales',
      {
        customer_id: testSalesCustomerId,
        status: 'DRAFT',
        items: [{ product_id: testPoProductId, quantity: 1, unit_price: 100 }],
      },
      salesManagerToken
    );
    const cancelTargetId = draftForCancelRes.body?.data?.id;
    await makeRequest(
      port,
      'PATCH',
      `/api/sales/${cancelTargetId}/status`,
      { status: 'CANCELLED' },
      salesManagerToken
    );
    const completeCancelledRes = await makeRequest(
      port,
      'POST',
      `/api/sales/${cancelTargetId}/complete`,
      {},
      salesManagerToken
    );
    assert(
      completeCancelledRes.status === 400 &&
        completeCancelledRes.body.success === false &&
        completeCancelledRes.body.message.includes('cancelled'),
      'TEST 82: Cancelled order cannot be completed',
      `Expected status 400 rejecting completion of cancelled order, got ${completeCancelledRes.status}`
    );

    // TEST 83: Role-based authorization on Sales operations
    const viewerCreateSoRes = await makeRequest(
      port,
      'POST',
      '/api/sales',
      {
        customer_id: testSalesCustomerId,
        items: [{ product_id: testPoProductId, quantity: 1, unit_price: 100 }],
      },
      viewerToken
    );
    const viewerCompleteSoRes = await makeRequest(
      port,
      'POST',
      `/api/sales/${createdSoId}/complete`,
      {},
      viewerToken
    );
    const viewerReadSoRes = await makeRequest(
      port,
      'GET',
      '/api/sales',
      undefined,
      viewerToken
    );
    const viewerReadSingleSoRes = await makeRequest(
      port,
      'GET',
      `/api/sales/${createdSoId}`,
      undefined,
      viewerToken
    );
    assert(
      viewerCreateSoRes.status === 403 &&
        viewerCompleteSoRes.status === 403 &&
        viewerReadSoRes.status === 200 &&
        viewerReadSingleSoRes.status === 200,
      'TEST 83: Role-based authorization on Sales operations (VIEWER forbidden from creating/completing, but can read)',
      `Expected create=403, complete=403, read=200, got create=${viewerCreateSoRes.status}, complete=${viewerCompleteSoRes.status}, read=${viewerReadSoRes.status}`
    );

    // ====================================================
    // MODULE 8: INVOICE MANAGEMENT
    // ====================================================
    console.log('\n--- MODULE 8: INVOICE MANAGEMENT ---');

    // TEST 84: List invoices & metrics query (Verify seeded invoice exists)
    const listInvoicesRes = await makeRequest(
      port,
      'GET',
      '/api/invoices',
      undefined,
      adminToken
    );
    const invoiceMetricsRes = await makeRequest(
      port,
      'GET',
      '/api/invoices/metrics',
      undefined,
      adminToken
    );
    assert(
      listInvoicesRes.status === 200 &&
        listInvoicesRes.body.success === true &&
        Array.isArray(listInvoicesRes.body.data.items) &&
        listInvoicesRes.body.data.total >= 1 &&
        invoiceMetricsRes.status === 200 &&
        invoiceMetricsRes.body.data.total_invoices >= 1,
      'TEST 84: List invoices & metrics query (Verify seeded invoice exists)',
      `Expected status 200 with total invoices >= 1, got list=${listInvoicesRes.status}, metrics=${invoiceMetricsRes.status}`
    );

    // TEST 85: Preview invoice generated from Sales Order
    const previewSoInvoiceRes = await makeRequest(
      port,
      'GET',
      `/api/invoices/preview-sales/${createdSoId}`,
      undefined,
      salesManagerToken
    );
    assert(
      previewSoInvoiceRes.status === 200 &&
        previewSoInvoiceRes.body.success === true &&
        previewSoInvoiceRes.body.data.sales_order_id === createdSoId &&
        Array.isArray(previewSoInvoiceRes.body.data.items) &&
        previewSoInvoiceRes.body.data.items.length > 0 &&
        previewSoInvoiceRes.body.data.total > 0,
      'TEST 85: Preview invoice generated from Sales Order',
      `Expected status 200 with preview data for SO #${createdSoId}, got ${previewSoInvoiceRes.status}`
    );

    // TEST 86: Create invoice from completed sales order (Auto-populates items & totals)
    const createInvoiceRes = await makeRequest(
      port,
      'POST',
      '/api/invoices',
      {
        sales_order_id: createdSoId,
        invoice_date: '2026-10-22',
        due_date: '2026-11-22',
        status: 'ISSUED',
        notes: 'Commercial invoice generated from completed customer order.',
      },
      salesManagerToken
    );
    const createdInvoiceId = createInvoiceRes.body?.data?.id;
    const createdInvoiceNumber = createInvoiceRes.body?.data?.invoice_number;
    assert(
      createInvoiceRes.status === 201 &&
        createInvoiceRes.body.success === true &&
        createdInvoiceId &&
        createdInvoiceNumber &&
        createdInvoiceNumber.startsWith('INV-') &&
        createInvoiceRes.body.data.sales_order_id === createdSoId &&
        createInvoiceRes.body.data.status === 'ISSUED' &&
        Array.isArray(createInvoiceRes.body.data.items) &&
        createInvoiceRes.body.data.items.length > 0 &&
        createInvoiceRes.body.data.total > 0,
      'TEST 86: Create invoice from completed sales order (Auto-populates items & totals)',
      `Expected status 201 with generated invoice, got status=${createInvoiceRes.status}, body=${JSON.stringify(createInvoiceRes.body)}`
    );

    // TEST 87: Fetch invoice details by ID (Verify items, customer, and sales order linkage)
    const getInvoiceRes = await makeRequest(
      port,
      'GET',
      `/api/invoices/${createdInvoiceId}`,
      undefined,
      adminToken
    );
    assert(
      getInvoiceRes.status === 200 &&
        getInvoiceRes.body.success === true &&
        getInvoiceRes.body.data.id === createdInvoiceId &&
        getInvoiceRes.body.data.customer &&
        getInvoiceRes.body.data.customer.id === testSalesCustomerId &&
        getInvoiceRes.body.data.sales_order &&
        getInvoiceRes.body.data.sales_order.id === createdSoId &&
        getInvoiceRes.body.data.items.length > 0,
      'TEST 87: Fetch invoice details by ID (Verify items, customer, and sales order linkage)',
      `Expected status 200 with full details, customer, and SO linkage, got ${getInvoiceRes.status}`
    );

    // TEST 88: Validation check: reject invalid invoice (missing customer, empty items, or negative values)
    const invalidInvoiceRes = await makeRequest(
      port,
      'POST',
      '/api/invoices',
      {
        customer_id: '',
        items: [],
      },
      salesManagerToken
    );
    const negativeQtyInvoiceRes = await makeRequest(
      port,
      'POST',
      '/api/invoices',
      {
        customer_id: testSalesCustomerId,
        items: [{ description: 'Invalid item', quantity: -5, unit_price: 100 }],
      },
      salesManagerToken
    );
    assert(
      invalidInvoiceRes.status === 400 &&
        invalidInvoiceRes.body.success === false &&
        negativeQtyInvoiceRes.status === 400 &&
        negativeQtyInvoiceRes.body.success === false,
      'TEST 88: Validation check: reject invalid invoice (missing customer, empty items, or negative values)',
      `Expected status 400 for invalid invoice payloads, got empty=${invalidInvoiceRes.status}, negativeQty=${negativeQtyInvoiceRes.status}`
    );

    // TEST 89: Validation check: enforce unique invoice number
    const duplicateInvNumRes = await makeRequest(
      port,
      'POST',
      '/api/invoices',
      {
        invoice_number: createdInvoiceNumber,
        customer_id: testSalesCustomerId,
        items: [{ description: 'Duplicate number attempt', quantity: 1, unit_price: 50 }],
      },
      salesManagerToken
    );
    assert(
      duplicateInvNumRes.status === 409 &&
        duplicateInvNumRes.body.success === false &&
        duplicateInvNumRes.body.message.includes('unique'),
      'TEST 89: Validation check: enforce unique invoice number',
      `Expected status 409 rejecting duplicate invoice number, got ${duplicateInvNumRes.status}`
    );

    // TEST 90: Create, edit, and recalculate draft invoice
    const draftInvoiceRes = await makeRequest(
      port,
      'POST',
      '/api/invoices',
      {
        customer_id: testSalesCustomerId,
        status: 'DRAFT',
        items: [
          { product_id: testPoProductId, description: 'Draft service item', quantity: 2, unit_price: 150.0 },
        ],
      },
      salesManagerToken
    );
    const draftInvoiceId = draftInvoiceRes.body?.data?.id;

    const updateDraftRes = await makeRequest(
      port,
      'PUT',
      `/api/invoices/${draftInvoiceId}`,
      {
        customer_id: testSalesCustomerId,
        notes: 'Updated invoice notes with discount applied.',
        tax: 20.0,
        discount: 10.0,
        items: [
          { product_id: testPoProductId, description: 'Draft item updated', quantity: 3, unit_price: 150.0 },
        ],
      },
      salesManagerToken
    );
    // 3 * 150 = 450; +20 tax - 10 discount = 460
    assert(
      draftInvoiceRes.status === 201 &&
        updateDraftRes.status === 200 &&
        updateDraftRes.body.data.subtotal === 450.0 &&
        updateDraftRes.body.data.tax === 20.0 &&
        updateDraftRes.body.data.discount === 10.0 &&
        updateDraftRes.body.data.total === 460.0 &&
        updateDraftRes.body.data.items[0].quantity === 3,
      'TEST 90: Create, edit, and recalculate draft invoice',
      `Expected status 200 with recalculated totals (460.0), got ${updateDraftRes.status}, total=${updateDraftRes.body?.data?.total}`
    );

    // TEST 91: Status transitions: DRAFT -> ISSUED -> PAID
    const issueStatusRes = await makeRequest(
      port,
      'PATCH',
      `/api/invoices/${draftInvoiceId}/status`,
      { status: 'ISSUED' },
      salesManagerToken
    );
    const paidStatusRes = await makeRequest(
      port,
      'PATCH',
      `/api/invoices/${draftInvoiceId}/status`,
      { status: 'PAID' },
      salesManagerToken
    );
    const invalidPaidTransitionRes = await makeRequest(
      port,
      'PATCH',
      `/api/invoices/${draftInvoiceId}/status`,
      { status: 'DRAFT' },
      salesManagerToken
    );
    assert(
      issueStatusRes.status === 200 &&
        issueStatusRes.body.data.status === 'ISSUED' &&
        paidStatusRes.status === 200 &&
        paidStatusRes.body.data.status === 'PAID' &&
        invalidPaidTransitionRes.status === 400 &&
        invalidPaidTransitionRes.body.success === false,
      'TEST 91: Status transitions: DRAFT -> ISSUED -> PAID and reject illegal transitions from terminal status',
      `Expected ISSUED=200, PAID=200, PAID->DRAFT=400, got issue=${issueStatusRes.status}, paid=${paidStatusRes.status}, invalid=${invalidPaidTransitionRes.status}`
    );

    // TEST 92: Status transition: Cancel draft invoice
    const cancelTargetInvoiceRes = await makeRequest(
      port,
      'POST',
      '/api/invoices',
      {
        customer_id: testSalesCustomerId,
        status: 'DRAFT',
        items: [{ description: 'Cancellation test', quantity: 1, unit_price: 30 }],
      },
      salesManagerToken
    );
    const cancelTargetInvoiceId = cancelTargetInvoiceRes.body?.data?.id;

    const cancelStatusRes = await makeRequest(
      port,
      'PATCH',
      `/api/invoices/${cancelTargetInvoiceId}/status`,
      { status: 'CANCELLED' },
      salesManagerToken
    );
    assert(
      cancelTargetInvoiceRes.status === 201 &&
        cancelStatusRes.status === 200 &&
        cancelStatusRes.body.data.status === 'CANCELLED',
      'TEST 92: Status transition: Cancel invoice (DRAFT -> CANCELLED)',
      `Expected status 200 transitioning to CANCELLED, got ${cancelStatusRes.status}`
    );

    // TEST 93: CRITICAL SCM INVARIANT: Invoice creation and status updates DO NOT modify physical inventory stock balance or audit transactions
    const invCheckBeforeRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testPoProductId}`,
      undefined,
      adminToken
    );
    const stockBalanceBefore = invCheckBeforeRes.body.data.current_quantity;

    const txCheckBeforeRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/transactions?product_id=${testPoProductId}`,
      undefined,
      adminToken
    );
    const txCountBefore = txCheckBeforeRes.body.data.total;

    // Create a new invoice and transition to PAID
    const invInvariantRes = await makeRequest(
      port,
      'POST',
      '/api/invoices',
      {
        customer_id: testSalesCustomerId,
        status: 'DRAFT',
        items: [
          { product_id: testPoProductId, description: 'Inventory Invariant Check Item', quantity: 5, unit_price: 150.0 },
        ],
      },
      salesManagerToken
    );
    const invInvariantId = invInvariantRes.body.data.id;
    await makeRequest(
      port,
      'PATCH',
      `/api/invoices/${invInvariantId}/status`,
      { status: 'ISSUED' },
      salesManagerToken
    );
    await makeRequest(
      port,
      'PATCH',
      `/api/invoices/${invInvariantId}/status`,
      { status: 'PAID' },
      salesManagerToken
    );

    const invCheckAfterRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/item/${testPoProductId}`,
      undefined,
      adminToken
    );
    const stockBalanceAfter = invCheckAfterRes.body.data.current_quantity;

    const txCheckAfterRes = await makeRequest(
      port,
      'GET',
      `/api/inventory/transactions?product_id=${testPoProductId}`,
      undefined,
      adminToken
    );
    const txCountAfter = txCheckAfterRes.body.data.total;

    assert(
      stockBalanceBefore === stockBalanceAfter &&
        txCountBefore === txCountAfter,
      'TEST 93: CRITICAL SCM INVARIANT: Invoice creation and status updates DO NOT modify physical inventory stock balance or audit transactions',
      `Expected stock balance (${stockBalanceBefore}) and transaction count (${txCountBefore}) to remain completely unchanged, got stock=${stockBalanceAfter}, tx=${txCountAfter}`
    );

    // TEST 94: Role-based authorization on Invoices operations (VIEWER can read, but is forbidden from creating/editing)
    const viewerReadInvoicesRes = await makeRequest(
      port,
      'GET',
      '/api/invoices',
      undefined,
      viewerToken
    );
    const viewerReadSingleInvoiceRes = await makeRequest(
      port,
      'GET',
      `/api/invoices/${createdInvoiceId}`,
      undefined,
      viewerToken
    );
    const viewerCreateInvoiceRes = await makeRequest(
      port,
      'POST',
      '/api/invoices',
      {
        customer_id: testSalesCustomerId,
        items: [{ description: 'Unauthorized invoice attempt', quantity: 1, unit_price: 100 }],
      },
      viewerToken
    );
    const viewerUpdateInvoiceRes = await makeRequest(
      port,
      'PUT',
      `/api/invoices/${createdInvoiceId}`,
      { customer_id: testSalesCustomerId },
      viewerToken
    );
    const viewerStatusInvoiceRes = await makeRequest(
      port,
      'PATCH',
      `/api/invoices/${createdInvoiceId}/status`,
      { status: 'PAID' },
      viewerToken
    );
    assert(
      viewerReadInvoicesRes.status === 200 &&
        viewerReadSingleInvoiceRes.status === 200 &&
        viewerCreateInvoiceRes.status === 403 &&
        viewerUpdateInvoiceRes.status === 403 &&
        viewerStatusInvoiceRes.status === 403,
      'TEST 94: Role-based authorization on Invoices operations (VIEWER can read, forbidden 403 on create/edit/status)',
      `Expected read=200, create=403, update=403, status=403, got read=${viewerReadInvoicesRes.status}, create=${viewerCreateInvoiceRes.status}, update=${viewerUpdateInvoiceRes.status}, status=${viewerStatusInvoiceRes.status}`
    );

    // TEST 95: Regression check: Existing Sales and Inventory modules remain 100% operational
    const salesHealthRes = await makeRequest(port, 'GET', '/api/sales', undefined, adminToken);
    const inventoryHealthRes = await makeRequest(port, 'GET', '/api/inventory', undefined, adminToken);
    const productsHealthRes = await makeRequest(port, 'GET', '/api/products', undefined, adminToken);
    assert(
      salesHealthRes.status === 200 &&
        inventoryHealthRes.status === 200 &&
        productsHealthRes.status === 200,
      'TEST 95: Regression check: Existing Sales, Inventory, and Product modules remain 100% operational',
      `Expected status 200 across existing modules, got sales=${salesHealthRes.status}, inv=${inventoryHealthRes.status}, prod=${productsHealthRes.status}`
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
