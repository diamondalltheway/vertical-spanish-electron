const INTERNAL_HOSTS = new Set(['verticalspanish.com', 'www.verticalspanish.com']);
const SAFE_EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:']);

function parseUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function isAllowedInternalUrl(rawUrl) {
  const url = parseUrl(rawUrl);
  return Boolean(url && url.protocol === 'https:' && INTERNAL_HOSTS.has(url.hostname.toLowerCase()));
}

function isSafeExternalUrl(rawUrl) {
  const url = parseUrl(rawUrl);
  if (!url || isAllowedInternalUrl(rawUrl)) {
    return false;
  }

  return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol);
}

function classifyNavigation(rawUrl) {
  if (isAllowedInternalUrl(rawUrl)) {
    return 'allow';
  }

  if (isSafeExternalUrl(rawUrl)) {
    return 'external';
  }

  return 'block';
}

module.exports = {
  INTERNAL_HOSTS,
  classifyNavigation,
  isAllowedInternalUrl,
  isSafeExternalUrl,
  parseUrl,
};
