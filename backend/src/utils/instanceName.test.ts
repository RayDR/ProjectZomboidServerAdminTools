import { validateInstanceName, sanitizeInstanceName, getServiceName, assertValidServiceName } from './instanceName';
import { ValidationError } from './errors';

describe('instanceName utils', () => {
  describe('validateInstanceName', () => {
    it('accepts valid names', () => {
      expect(validateInstanceName('Server_1')).toBe(true);
      expect(validateInstanceName('my-server-2')).toBe(true);
      expect(validateInstanceName('A')).toBe(true);
    });

    it('rejects invalid names', () => {
      expect(validateInstanceName('../../etc/passwd')).toBe(false);
      expect(validateInstanceName('server; rm -rf /')).toBe(false);
      expect(validateInstanceName('server name')).toBe(false);
      expect(validateInstanceName('server|whoami')).toBe(false);
      expect(validateInstanceName('')).toBe(false);
    });
  });

  describe('sanitizeInstanceName', () => {
    it('strips invalid characters', () => {
      expect(sanitizeInstanceName('server name!')).toBe('servername');
      expect(sanitizeInstanceName('../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeInstanceName('valid-name_1')).toBe('valid-name_1');
    });
  });

  describe('assertValidServiceName', () => {
    it('accepts valid service names', () => {
      expect(() => assertValidServiceName('pzomboid-test')).not.toThrow();
      expect(() => assertValidServiceName('pzomboid@test')).not.toThrow();
    });

    it('rejects invalid service names', () => {
      expect(() => assertValidServiceName('apache2')).toThrow(ValidationError);
      expect(() => assertValidServiceName('pzomboid-;')).toThrow(ValidationError);
      expect(() => assertValidServiceName('pzomboid@../../test')).toThrow(ValidationError);
    });
  });
});
