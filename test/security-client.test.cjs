const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadClient() {
  let rejection;
  let refreshCount = 0;
  let resolveRefresh, rejectRefresh;
  let token = 'old-access';
  let signOutCount = 0;
  const retries = [];
  const instance = (config) => {
    retries.push(config);
    return Promise.resolve({ data: 'retried' });
  };
  instance.interceptors = {
    request: { use() {} },
    response: {
      use(success, failure) {
        rejection = failure;
      },
    },
  };
  const axios = {
    create: () => instance,
    get: () => {
      refreshCount++;
      return new Promise((resolve, reject) => {
        resolveRefresh = resolve;
        rejectRefresh = reject;
      });
    },
    isAxiosError: (error) => error?.isAxiosError === true,
  };
  const module = { exports: {} };
  const filename = path.join(__dirname, '../src/lib/api/client.ts');
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(
    source,
    {
      module,
      exports: module.exports,
      require: (name) => {
        assert.equal(name, 'axios');
        return axios;
      },
      process: { env: {} },
    },
    { filename }
  );
  module.exports.injectAuthStore({
    getAccessToken: () => token,
    setAccessToken: (value) => {
      token = value;
    },
    signOut: () => {
      token = null;
      signOutCount++;
    },
  });
  const error = (url = '/subject/example', status = 401) => ({
    config: { url, headers: {} },
    response: { status, data: { message: 'denied' } },
  });
  return {
    api: module.exports,
    error,
    reject: (...args) => rejection(...args),
    refreshCount: () => refreshCount,
    retries,
    signOutCount: () => signOutCount,
    token: () => token,
    setToken: (value) => {
      token = value;
    },
    resolveRefresh: () => resolveRefresh({ data: { accessToken: 'fresh-access' } }),
    failRefresh: (status) => rejectRefresh({ isAxiosError: true, response: { status } }),
  };
}

test('concurrent expired HTTP requests share one cookie-backed refresh and all retry', async () => {
  const f = loadClient();
  const requests = Array.from({ length: 4 }, () => f.reject(f.error()));
  assert.equal(f.refreshCount(), 1);
  f.resolveRefresh();
  await Promise.all(requests);
  assert.equal(f.retries.length, 4);
  assert.ok(f.retries.every((config) => config.headers.Authorization === 'Bearer fresh-access'));
});
test('failed refresh settles every waiting request; transient failure preserves the session', async () => {
  const f = loadClient();
  const requests = [f.reject(f.error()), f.reject(f.error())];
  f.failRefresh(503);
  const outcomes = await Promise.allSettled(requests);
  assert.ok(outcomes.every((result) => result.status === 'rejected'));
  assert.equal(f.signOutCount(), 0);
  const retry = f.api.refreshSession();
  f.resolveRefresh();
  assert.equal(await retry, 'fresh-access');
  assert.equal(f.refreshCount(), 2);
});
test('a late refresh response cannot restore an earlier account after sign-out or login', async () => {
  const f = loadClient();
  const request = f.api.refreshSession();
  f.setToken('different-account');
  f.resolveRefresh();
  await assert.rejects(request, { code: 'SESSION_CHANGED' });
  assert.equal(f.token(), 'different-account');
});
test('wrong current-password errors and public reset failures never trigger refresh', async () => {
  const f = loadClient();
  await assert.rejects(f.reject(f.error('/user/password', 400)));
  await assert.rejects(f.reject(f.error('/user/changepassword', 400)));
  await assert.rejects(f.reject(f.error('/user/login', 401)));
  assert.equal(f.refreshCount(), 0);
});
