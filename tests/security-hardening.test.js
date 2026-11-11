const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const mongoose = require('mongoose');

const { getAppBaseUrl, buildAppUrl } = require('../server/utils/urlUtils');
const { getJwtSecret, verifyToken, verifyCustomer, verifyAdmin } = require('../server/middleware/authMiddleware');
const { checkPermission } = require('../server/middleware/roleMiddleware');
const { errorHandler } = require('../server/middleware/errorMiddleware');
const Admin = require('../server/models/Admin');
const Customer = require('../server/models/Customer');
const Loan = require('../server/models/Loan');
const LoanApplication = require('../server/models/LoanApplication');
const authController = require('../server/controllers/authController');
const loanController = require('../server/controllers/loanController');
const adminController = require('../server/controllers/adminController');

const ROOT = path.resolve(__dirname, '..');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function captureConsole(fn) {
  const original = { log: console.log, warn: console.warn, error: console.error };
  const messages = [];
  const record = (...args) => {
    messages.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  };
  console.log = record;
  console.warn = record;
  console.error = record;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
    })
    .then((result) => ({ result, logs: messages.join('\n') }));
}

test('urlUtils validates and normalizes APP_BASE_URL', () => {
  const prev = process.env.APP_BASE_URL;
  try {
    delete process.env.APP_BASE_URL;
    assert.throws(() => getAppBaseUrl(), /APP_BASE_URL is required/);

    process.env.APP_BASE_URL = 'ftp://invalid.example';
    assert.throws(() => getAppBaseUrl(), /http:\/\/ or https:\/\//);

    process.env.APP_BASE_URL = 'https://microfinance.example.com/';
    assert.equal(getAppBaseUrl(), 'https://microfinance.example.com');
    assert.equal(buildAppUrl('customer/reset-password'), 'https://microfinance.example.com/customer/reset-password');
  } finally {
    if (prev === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = prev;
  }
});

test('authMiddleware fails closed without JWT_SECRET and enforces roles', () => {
  const prevSecret = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => getJwtSecret(), /JWT_SECRET/);

    const missingSecretRes = createMockRes();
    verifyToken({ headers: { authorization: 'Bearer some-token' } }, missingSecretRes, () => {
      assert.fail('next should not run when JWT_SECRET is missing');
    });
    assert.equal(missingSecretRes.statusCode, 500);

    process.env.JWT_SECRET = 'test-signing-secret-minimum-32-chars';
    const customerToken = jwt.sign({ id: 'cust-1', role: 'customer', email: 'c@example.test' }, process.env.JWT_SECRET);
    const adminToken = jwt.sign({ id: 'adm-1', role: 'admin', email: 'a@example.test' }, process.env.JWT_SECRET);

    const noTokenRes = createMockRes();
    verifyToken({ headers: {} }, noTokenRes, () => assert.fail('next should not run'));
    assert.equal(noTokenRes.statusCode, 401);

    const wrongRoleRes = createMockRes();
    verifyAdmin({ headers: { authorization: `Bearer ${customerToken}` } }, wrongRoleRes, () => {
      assert.fail('customer token must not pass verifyAdmin');
    });
    assert.equal(wrongRoleRes.statusCode, 403);

    const customerForbiddenRes = createMockRes();
    verifyCustomer({ headers: { authorization: `Bearer ${adminToken}` } }, customerForbiddenRes, () => {
      assert.fail('admin token must not pass verifyCustomer');
    });
    assert.equal(customerForbiddenRes.statusCode, 403);

    const validReq = { headers: { authorization: `Bearer ${adminToken}` } };
    let passed = false;
    verifyAdmin(validReq, createMockRes(), () => {
      passed = true;
    });
    assert.equal(passed, true);
    assert.equal(validReq.user.id, 'adm-1');
  } finally {
    if (prevSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prevSecret;
  }
});

test('roleMiddleware fails closed on missing req.user and sanitizes 500 errors', async () => {
  const middleware = checkPermission('approve-loans');
  const unauthRes = createMockRes();
  await middleware({ headers: {} }, unauthRes, () => assert.fail('next should not run'));
  assert.equal(unauthRes.statusCode, 401);

  const origFindById = Admin.findById;
  try {
    Admin.findById = async () => {
      throw new Error('sensitive mongoose connection string secret');
    };
    const errRes = createMockRes();
    const { logs } = await captureConsole(() =>
      middleware({ headers: { authorization: 'Bearer x' }, user: { id: 'adm-1' } }, errRes, () => {})
    );
    assert.equal(errRes.statusCode, 500);
    assert.equal(errRes.body.error, undefined);
    assert.ok(!JSON.stringify(errRes.body).includes('sensitive mongoose connection string secret'));
    assert.ok(!logs.includes('sensitive mongoose connection string secret'));

    Admin.findById = async () => ({
      accountStatus: 'active',
      permissions: { canApproveLoans: false },
    });
    const deniedRes = createMockRes();
    await middleware({ headers: { authorization: 'Bearer x' }, user: { id: 'adm-1' } }, deniedRes, () =>
      assert.fail('next must not execute without permission')
    );
    assert.equal(deniedRes.statusCode, 403);
  } finally {
    Admin.findById = origFindById;
  }
});

test('errorHandler masks 5xx internal error messages', async () => {
  const res500 = createMockRes();
  await captureConsole(() => {
    errorHandler(new Error('mongodb://user:pass@internal/db error'), { path: '/x', method: 'GET' }, res500, () => {});
  });
  assert.equal(res500.statusCode, 500);
  assert.equal(res500.body.message, 'Something went wrong. Please try again later.');
  assert.ok(!JSON.stringify(res500.body).includes('mongodb://'));

  const res400 = createMockRes();
  errorHandler(Object.assign(new Error('Bad payload'), { statusCode: 400 }), { path: '/x', method: 'POST' }, res400, () => {});
  assert.equal(res400.statusCode, 400);
  assert.equal(res400.body.message, 'Bad payload');
});

test('emailService never logs reset tokens or exposes reset links', async () => {
  const prevEnv = {
    NODE_ENV: process.env.NODE_ENV,
    APP_BASE_URL: process.env.APP_BASE_URL,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  };
  try {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASSWORD;
    process.env.APP_BASE_URL = 'https://microfinance.example.com';
    process.env.NODE_ENV = 'development';

    const emailServicePath = require.resolve('../server/utils/emailService');
    delete require.cache[emailServicePath];
    const emailService = require('../server/utils/emailService');

    const secretResetToken = 'super-secret-reset-token-value-123456';
    const { result, logs } = await captureConsole(() =>
      emailService.sendCustomerPasswordResetEmail('user@example.test', secretResetToken)
    );
    assert.equal(result.delivered, false);
    assert.equal(result.resetLink, undefined);
    assert.ok(!logs.includes(secretResetToken));
    assert.ok(!logs.includes('/customer/reset-password'));
    assert.deepEqual((await emailService.verifyEmailConfig()).verified, false);

    process.env.NODE_ENV = 'production';
    await assert.rejects(
      () => emailService.sendAdminPasswordResetEmail('admin@example.test', secretResetToken),
      /SMTP email service is not configured/
    );
  } finally {
    for (const [k, v] of Object.entries(prevEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test('authController forgot/reset password prevents enumeration, short passwords, and token logs', async () => {
  const origCustomerFindOne = Customer.findOne;
  const origAdminFindOne = Admin.findOne;
  const prevUrl = process.env.APP_BASE_URL;
  const prevEnv = process.env.NODE_ENV;
  try {
    process.env.APP_BASE_URL = 'https://microfinance.example.com';
    process.env.NODE_ENV = 'development';

    const secretToken = 'raw-reset-token-should-never-appear-in-logs-or-json';
    Customer.findOne = async () => ({
      _id: 'cust-1',
      generateResetToken: () => secretToken,
      save: async () => {},
    });

    const foundRes = createMockRes();
    const { logs } = await captureConsole(() =>
      authController.customerForgotPassword({ body: { email: 'user@example.test' } }, foundRes)
    );
    assert.equal(foundRes.statusCode, 200);
    assert.equal(foundRes.body.testResetLink, undefined);
    assert.ok(!logs.includes(secretToken));
    assert.ok(!logs.includes('user@example.test'));

    Customer.findOne = async () => null;
    const missingRes = createMockRes();
    await authController.customerForgotPassword({ body: { email: 'missing@example.test' } }, missingRes);
    assert.deepEqual(missingRes.body, foundRes.body);

    const shortCustRes = createMockRes();
    await authController.customerResetPassword(
      { body: { token: 'abc', password: '1234567', confirmPassword: '1234567' } },
      shortCustRes
    );
    assert.equal(shortCustRes.statusCode, 400);
    assert.match(shortCustRes.body.message, /at least 8 characters/);

    const shortAdmRes = createMockRes();
    await authController.adminResetPassword(
      { body: { token: 'abc', password: '1234567', confirmPassword: '1234567' } },
      shortAdmRes
    );
    assert.equal(shortAdmRes.statusCode, 400);
    assert.match(shortAdmRes.body.message, /at least 8 characters/);
  } finally {
    Customer.findOne = origCustomerFindOne;
    Admin.findOne = origAdminFindOne;
    if (prevUrl === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = prevUrl;
    if (prevEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevEnv;
  }
});

test('loanController blocks cross-customer IDOR and updateLoan mass assignment', async () => {
  const origAppFind = LoanApplication.find;
  const origAppFindById = LoanApplication.findById;
  const origLoanUpdate = Loan.findByIdAndUpdate;
  try {
    const idorListRes = createMockRes();
    await loanController.getCustomerApplications(
      { params: { customerId: 'victim-id' }, user: { id: 'attacker-id', role: 'customer' } },
      idorListRes
    );
    assert.equal(idorListRes.statusCode, 403);

    LoanApplication.find = () => ({
      populate: () => ({
        sort: async () => [{ _id: 'app-1', customerId: 'victim-id' }],
      }),
    });
    const adminListRes = createMockRes();
    await loanController.getCustomerApplications(
      { params: { customerId: 'victim-id' }, user: { id: 'admin-1', role: 'admin' } },
      adminListRes
    );
    assert.equal(adminListRes.statusCode, 200);
    assert.equal(adminListRes.body.count, 1);

    LoanApplication.findById = () => ({
      populate: () => ({
        populate: () => ({
          populate: async () => ({ _id: 'app-2', customerId: { _id: 'victim-id' } }),
        }),
      }),
    });
    const idorDetailRes = createMockRes();
    await loanController.getApplicationDetails(
      { params: { applicationId: 'app-2' }, user: { id: 'attacker-id', role: 'customer' } },
      idorDetailRes
    );
    assert.equal(idorDetailRes.statusCode, 403);

    let capturedUpdate = null;
    Loan.findByIdAndUpdate = async (_id, payload) => {
      capturedUpdate = payload;
      return { _id: 'loan-1', ...payload };
    };
    const updateRes = createMockRes();
    await loanController.updateLoan(
      { params: { id: 'loan-1' }, body: { name: 'Updated Loan', createdBy: 'attacker', _id: 'evil' } },
      updateRes
    );
    assert.equal(updateRes.statusCode, 200);
    assert.deepEqual(capturedUpdate, { name: 'Updated Loan' });

    const invalidUpdateRes = createMockRes();
    await loanController.updateLoan(
      { params: { id: 'loan-1' }, body: { createdBy: 'attacker' } },
      invalidUpdateRes
    );
    assert.equal(invalidUpdateRes.statusCode, 400);
  } finally {
    LoanApplication.find = origAppFind;
    LoanApplication.findById = origAppFindById;
    Loan.findByIdAndUpdate = origLoanUpdate;
  }
});

test('adminController rejects NoSQL operator injection and bounds pagination', async () => {
  const origCustFind = Customer.find;
  const origCustCount = Customer.countDocuments;
  try {
    const injectRes = createMockRes();
    await adminController.getAllCustomers(
      { query: { kycStatus: { $ne: 'verified' } } },
      injectRes
    );
    assert.equal(injectRes.statusCode, 400);

    let capturedLimit = null;
    Customer.find = () => ({
      select: () => ({
        skip: () => ({
          limit: (n) => {
            capturedLimit = n;
            return { sort: async () => [] };
          },
        }),
      }),
    });
    Customer.countDocuments = async () => 0;

    const okRes = createMockRes();
    await adminController.getAllCustomers(
      { query: { kycStatus: 'pending', page: '-5', limit: '9999' } },
      okRes
    );
    assert.equal(okRes.statusCode, 200);
    assert.equal(capturedLimit, 100);
    assert.equal(okRes.body.pagination.page, 1);
  } finally {
    Customer.find = origCustFind;
    Customer.countDocuments = origCustCount;
  }
});

test('EJS templates compile and source contains no reset-token log leaks or registration innerHTML XSS', () => {
  const viewsDir = path.join(ROOT, 'views');
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && full.endsWith('.ejs')) {
        assert.doesNotThrow(() => ejs.compile(fs.readFileSync(full, 'utf8'), { filename: full }));
      }
    }
  };
  walk(viewsDir);

  const validationJs = fs.readFileSync(path.join(ROOT, 'public/js/registration-validation.js'), 'utf8');
  assert.ok(!validationJs.includes('helperText.innerHTML'));

  const authControllerSrc = fs.readFileSync(path.join(ROOT, 'server/controllers/authController.js'), 'utf8');
  assert.ok(!authControllerSrc.includes('Test link:'));
  assert.ok(!authControllerSrc.includes('testResetLink'));
});
