import { ValidationError } from './errors';

// Allow lowercase, uppercase, numbers, dash, and underscore. Max 48 chars.
const VALID_INSTANCE_NAME_REGEX = /^[a-zA-Z0-9_-]{1,48}$/;

// Allow canonical single-instance service and multi-instance variants.
const VALID_SERVICE_NAME_REGEX = /^(pzomboid|pzomboid-[a-zA-Z0-9_-]{1,48}|pzomboid@[a-zA-Z0-9_-]{1,48})$/;

export const validateInstanceName = (name: string): boolean => {
  return VALID_INSTANCE_NAME_REGEX.test(name);
};

export const sanitizeInstanceName = (name: string): string => {
  if (!name) return '';
  return name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
};

export const getServiceName = (name: string): string => {
  const sanitized = sanitizeInstanceName(name).toLowerCase();
  if (!sanitized) {
    throw new ValidationError('Instance name resolves to empty service name');
  }
  return `pzomboid-${sanitized}`;
};

export const assertValidServiceName = (serviceName: string): void => {
  if (!VALID_SERVICE_NAME_REGEX.test(serviceName)) {
    throw new ValidationError(`Invalid service name: ${serviceName}`);
  }
};
