"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const systemd_service_1 = require("../services/systemd.service");
const errors_1 = require("../utils/errors");
// Mock child_process and repositories
jest.mock('child_process', () => ({
    execFile: jest.fn()
}));
const child_process_1 = require("child_process");
const mockRepository = {
    readAll: jest.fn(),
    findByName: jest.fn(),
    exists: jest.fn(),
    writeAll: jest.fn(),
};
describe('SystemdService', () => {
    let service;
    beforeEach(() => {
        service = new systemd_service_1.SystemdService(mockRepository);
        jest.clearAllMocks();
    });
    it('should use sudo -n for execute', async () => {
        mockRepository.readAll.mockResolvedValue([{ serviceName: 'pzomboid-test' }]);
        const execFileMock = child_process_1.execFile;
        execFileMock.mockImplementation((cmd, args, callback) => callback(null, { stdout: 'ok', stderr: '' }));
        await service.execute('start', 'pzomboid-test');
        expect(execFileMock).toHaveBeenCalledWith('sudo', ['-n', '/usr/bin/systemctl', 'start', 'pzomboid-test'], expect.any(Function));
    });
    it('should throw AppError PERMISSION_DENIED_SYSTEMD if sudo asks for password', async () => {
        mockRepository.readAll.mockResolvedValue([{ serviceName: 'pzomboid-test' }]);
        const execFileMock = child_process_1.execFile;
        execFileMock.mockImplementation((cmd, args, callback) => {
            callback({ stderr: 'sudo: a password is required' }, null);
        });
        await expect(service.execute('start', 'pzomboid-test'))
            .rejects
            .toThrow(errors_1.AppError);
        try {
            await service.execute('start', 'pzomboid-test');
        }
        catch (e) {
            expect(e.code).toBe('PERMISSION_DENIED_SYSTEMD');
            expect(e.status).toBe(403);
        }
    });
    it('should reject invalid action', async () => {
        await expect(service.execute('delete', 'pzomboid-test'))
            .rejects
            .toThrow(errors_1.ValidationError);
    });
});
