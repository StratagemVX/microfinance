/**
 * URL Utilities
 * Ensures consistent, environment-based application URLs
 */

const normalizeBaseUrl = (baseUrl) => {
  const trimmed = baseUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error('APP_BASE_URL must include http:// or https://');
  }
  return trimmed.replace(/\/$/, '');
};

const getAppBaseUrl = () => {
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error('APP_BASE_URL is required to build public links. Set it in .env');
  }
  return normalizeBaseUrl(baseUrl);
};

const buildAppUrl = (path = '') => {
  const baseUrl = getAppBaseUrl();
  if (!path) return baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

module.exports = {
  getAppBaseUrl,
  buildAppUrl,
};
