"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertValidServiceName = exports.getServiceName = exports.sanitizeInstanceName = exports.validateInstanceName = void 0;
const errors_1 = require("./errors");
// Allow lowercase, uppercase, numbers, dash, and underscore. Max 48 chars.
const VALID_INSTANCE_NAME_REGEX = /^[a-zA-Z0-9_-]{1,48}$/;
// Allow canonical single-instance service and multi-instance variants.
const VALID_SERVICE_NAME_REGEX = /^(pzomboid|pzomboid-[a-zA-Z0-9_-]{1,48}|pzomboid@[a-zA-Z0-9_-]{1,48})$/;
const validateInstanceName = (name) => {
    return VALID_INSTANCE_NAME_REGEX.test(name);
};
exports.validateInstanceName = validateInstanceName;
const sanitizeInstanceName = (name) => {
    if (!name)
        return '';
    return name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
};
exports.sanitizeInstanceName = sanitizeInstanceName;
const getServiceName = (name) => {
    const sanitized = (0, exports.sanitizeInstanceName)(name).toLowerCase();
    if (!sanitized) {
        throw new errors_1.ValidationError('Instance name resolves to empty service name');
    }
    return `pzomboid-${sanitized}`;
};
exports.getServiceName = getServiceName;
const assertValidServiceName = (serviceName) => {
    if (!VALID_SERVICE_NAME_REGEX.test(serviceName)) {
        throw new errors_1.ValidationError(`Invalid service name: ${serviceName}`);
    }
};
exports.assertValidServiceName = assertValidServiceName;
