import { SystemdService } from '../services/systemd.service';
import { AppError, ValidationError } from '../utils/errors';

// Mock child_process and repositories
jest.mock('child_process', () => ({
  execFile: jest.fn()
}));
import { execFile } from 'child_process';

const mockRepository = {
  readAll: jest.fn(),
  findByName: jest.fn(),
  exists: jest.fn(),
  writeAll: jest.fn(),
};

describe('SystemdService', () => {
  let service: SystemdService;

  beforeEach(() => {
    service = new SystemdService(mockRepository as any);
    jest.clearAllMocks();
  });

  it('should use sudo -n for execute', async () => {
    mockRepository.readAll.mockResolvedValue([{ serviceName: 'pzomboid-test' }]);
    const execFileMock = execFile as unknown as jest.Mock;
    execFileMock.mockImplementation((cmd, args, callback) => callback(null, { stdout: 'ok', stderr: '' }));

    await service.execute('start', 'pzomboid-test');
    
    expect(execFileMock).toHaveBeenCalledWith('sudo', ['-n', '/usr/bin/systemctl', 'start', 'pzomboid-test'], expect.any(Function));
  });

  it('should throw AppError PERMISSION_DENIED_SYSTEMD if sudo asks for password', async () => {
    mockRepository.readAll.mockResolvedValue([{ serviceName: 'pzomboid-test' }]);
    const execFileMock = execFile as unknown as jest.Mock;
    execFileMock.mockImplementation((cmd, args, callback) => {
      callback({ stderr: 'sudo: a password is required' }, null);
    });

    await expect(service.execute('start', 'pzomboid-test'))
      .rejects
      .toThrow(AppError);

    try {
      await service.execute('start', 'pzomboid-test');
    } catch (e: any) {
      expect(e.code).toBe('PERMISSION_DENIED_SYSTEMD');
      expect(e.status).toBe(403);
    }
  });

  it('should reject invalid action', async () => {
    await expect(service.execute('delete' as any, 'pzomboid-test'))
      .rejects
      .toThrow(ValidationError);
  });
});
