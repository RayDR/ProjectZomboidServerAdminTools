"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.windowsProvisioningUnsupportedMessage = exports.windowsSystemdUnsupportedMessage = exports.WINDOWS_COMPATIBILITY_DOC = exports.isUnixLike = exports.isWindows = void 0;
exports.isWindows = process.platform === 'win32';
exports.isUnixLike = process.platform !== 'win32';
exports.WINDOWS_COMPATIBILITY_DOC = 'WINDOWS_UNIX_COMPATIBILITY.md';
exports.windowsSystemdUnsupportedMessage = 'This operation requires systemd and is only available on Linux/Unix hosts. On Windows, use WSL2 with systemd enabled or manage services manually. See WINDOWS_UNIX_COMPATIBILITY.md and scripts/windows/setup-windows-compat.bat.';
exports.windowsProvisioningUnsupportedMessage = 'Automatic instance provisioning/deletion uses Linux shell scripts (sudo/bash/systemd) and is not available natively on Windows. Use WSL2 mode or import existing instances manually. See WINDOWS_UNIX_COMPATIBILITY.md.';
