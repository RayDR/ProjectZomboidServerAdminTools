"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instanceName_1 = require("./instanceName");
const errors_1 = require("./errors");
describe('instanceName utils', () => {
    describe('validateInstanceName', () => {
        it('accepts valid names', () => {
            expect((0, instanceName_1.validateInstanceName)('Server_1')).toBe(true);
            expect((0, instanceName_1.validateInstanceName)('my-server-2')).toBe(true);
            expect((0, instanceName_1.validateInstanceName)('A')).toBe(true);
        });
        it('rejects invalid names', () => {
            expect((0, instanceName_1.validateInstanceName)('../../etc/passwd')).toBe(false);
            expect((0, instanceName_1.validateInstanceName)('server; rm -rf /')).toBe(false);
            expect((0, instanceName_1.validateInstanceName)('server name')).toBe(false);
            expect((0, instanceName_1.validateInstanceName)('server|whoami')).toBe(false);
            expect((0, instanceName_1.validateInstanceName)('')).toBe(false);
        });
    });
    describe('sanitizeInstanceName', () => {
        it('strips invalid characters', () => {
            expect((0, instanceName_1.sanitizeInstanceName)('server name!')).toBe('servername');
            expect((0, instanceName_1.sanitizeInstanceName)('../../etc/passwd')).toBe('etcpasswd');
            expect((0, instanceName_1.sanitizeInstanceName)('valid-name_1')).toBe('valid-name_1');
        });
    });
    describe('assertValidServiceName', () => {
        it('accepts valid service names', () => {
            expect(() => (0, instanceName_1.assertValidServiceName)('pzomboid-test')).not.toThrow();
            expect(() => (0, instanceName_1.assertValidServiceName)('pzomboid@test')).not.toThrow();
        });
        it('rejects invalid service names', () => {
            expect(() => (0, instanceName_1.assertValidServiceName)('apache2')).toThrow(errors_1.ValidationError);
            expect(() => (0, instanceName_1.assertValidServiceName)('pzomboid-;')).toThrow(errors_1.ValidationError);
            expect(() => (0, instanceName_1.assertValidServiceName)('pzomboid@../../test')).toThrow(errors_1.ValidationError);
        });
    });
});
