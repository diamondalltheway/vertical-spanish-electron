const assert = require('node:assert/strict');
const test = require('node:test');
const { classifyNavigation, isAllowedInternalUrl, isSafeExternalUrl, parseUrl } = require('../../src/url-policy');

test('allows secure Vertical Spanish URLs inside the app', () => {
  assert.equal(isAllowedInternalUrl('https://verticalspanish.com/'), true);
  assert.equal(isAllowedInternalUrl('https://verticalspanish.com/guides'), true);
  assert.equal(isAllowedInternalUrl('https://www.verticalspanish.com/conjugate/ser'), true);
  assert.equal(classifyNavigation('https://verticalspanish.com/quizzes'), 'allow');
});

test('keeps non-Vertical Spanish URLs outside the app only when protocol is safe', () => {
  assert.equal(isSafeExternalUrl('https://www.paypal.com/donate'), true);
  assert.equal(isSafeExternalUrl('mailto:hola@verticalspanish.com'), true);
  assert.equal(isSafeExternalUrl('http://verticalspanish.com/'), false);
  assert.equal(isSafeExternalUrl('file:///tmp/example.html'), false);
  assert.equal(classifyNavigation('https://www.paypal.com/donate'), 'external');
});

test('blocks invalid and unsafe navigations', () => {
  assert.equal(parseUrl('not a url'), null);
  assert.equal(classifyNavigation('not a url'), 'block');
  assert.equal(classifyNavigation('javascript:alert(1)'), 'block');
  assert.equal(classifyNavigation('file:///etc/passwd'), 'block');
  assert.equal(classifyNavigation('http://verticalspanish.com/'), 'block');
});
