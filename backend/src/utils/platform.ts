export const isWindows = process.platform === 'win32';
export const isUnixLike = process.platform !== 'win32';

export const WINDOWS_COMPATIBILITY_DOC = 'WINDOWS_UNIX_COMPATIBILITY.md';

export const windowsSystemdUnsupportedMessage =
  'This operation requires systemd and is only available on Linux/Unix hosts. On Windows, use WSL2 with systemd enabled or manage services manually. See WINDOWS_UNIX_COMPATIBILITY.md and scripts/windows/setup-windows-compat.bat.';

export const windowsProvisioningUnsupportedMessage =
  'Automatic instance provisioning/deletion uses Linux shell scripts (sudo/bash/systemd) and is not available natively on Windows. Use WSL2 mode or import existing instances manually. See WINDOWS_UNIX_COMPATIBILITY.md.';