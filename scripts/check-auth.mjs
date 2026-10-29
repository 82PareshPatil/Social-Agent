import assert from 'node:assert/strict';

const origin = process.env.TEST_APP_URL || 'http://localhost:3000';
const decode = (s) => s.replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&#x27;', "'");

async function submit(path, match, values) {
  const html = await (await fetch(`${origin}${path}`)).text();
  const form = [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map((x) => x[0]).find((x) => x.includes(match));
  assert.ok(form, `Missing ${match} form`);
  const body = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    if (!input[0].includes('type="hidden"')) continue;
    const name = input[0].match(/name="([^"]*)"/)?.[1];
    const value = input[0].match(/value="([^"]*)"/)?.[1] || '';
    if (name) body.append(decode(name), decode(value));
  }
  for (const [key, value] of Object.entries(values)) body.set(key, value);
  return fetch(`${origin}${path}`, { method: 'POST', body, redirect: 'manual', headers: { Origin: origin } });
}

for (const path of ['/sign-in', '/sign-up']) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('Continue with Google'));
  assert.ok(html.includes('name="password"'));
}
console.log('Auth pages and configured Google provider: passed');

for (const cookie of ['', 'insforge_access_token=invalid']) {
  const response = await fetch(`${origin}/dashboard`, { redirect: 'manual', headers: { Cookie: cookie } });
  assert.ok([303, 307].includes(response.status));
  assert.ok(response.headers.get('location')?.endsWith('/sign-in'));
}
console.log('Guest and invalid-token dashboard protection: passed');

const invalidEmail = await submit('/sign-in', 'name="password"', { email: 'invalid', password: 'invalid', intent: 'sign-in' });
assert.ok((await invalidEmail.text()).includes('Enter a valid email address.'));
console.log('Server-side form validation: passed');

const shortPassword = await submit('/sign-up', 'name="password"', {
  email: 'auth-check@example.invalid', password: 'x', name: 'Test', intent: 'sign-up',
});
assert.ok((await shortPassword.text()).includes('characters for your password.'));
const invalidCode = await submit('/sign-up', 'name="password"', {
  email: 'auth-check@example.invalid', otp: 'bad', intent: 'verify',
});
assert.ok((await invalidCode.text()).includes('Enter the 6-digit code from your email.'));
console.log('Signup password policy and verification-code validation: passed');

const badLogin = await submit('/sign-in', 'name="password"', { email: 'auth-check@example.invalid', password: 'invalid-password', intent: 'sign-in' });
assert.ok((await badLogin.text()).includes('Could not sign in. Check your email and password.'));
assert.ok(!badLogin.headers.get('set-cookie')?.includes('insforge_refresh_token='));
console.log('Rejected credentials do not create a session: passed');

const callback = await fetch(`${origin}/api/auth/callback?insforge_code=fake`, { redirect: 'manual' });
assert.ok(callback.headers.get('location')?.includes('/sign-in?error=oauth'));
console.log('OAuth callback rejects missing PKCE verifier: passed');

const google = await submit('/sign-in', 'Continue with Google', {});
assert.equal(google.status, 303);
assert.ok(google.headers.get('location')?.startsWith('https://'));
assert.ok(google.headers.get('set-cookie')?.includes('insforge_code_verifier='));
assert.ok(google.headers.get('set-cookie')?.toLowerCase().includes('httponly'));
console.log('Google OAuth initiation and httpOnly PKCE cookie: passed');
