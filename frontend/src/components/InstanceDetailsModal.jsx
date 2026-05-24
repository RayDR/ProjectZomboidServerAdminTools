import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaServer, FaPlay, FaStop, FaRedo, FaSkull, FaSave, FaUsers, FaBullhorn, FaPowerOff, FaDownload, FaTrash, FaSync, FaArrowUp, FaArrowDown, FaFilter, FaExclamationTriangle, FaLock, FaLockOpen } from 'react-icons/fa';
import { Button, Card, Badge } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n/index.jsx';
import ModsManager from './ModsManager';

const translateInstanceError = (message, t) => {
    const text = String(message || '').trim();
    if (!text) return t('instanceDetails.errors.unknown');

    const lowered = text.toLowerCase();
    if (lowered.includes('not found')) return t('instanceDetails.errors.notFound');
    if (lowered.includes('accessible')) return t('instanceDetails.errors.accessible');
    if (lowered.includes('failed to delete')) return t('instanceDetails.errors.deleteFailed');
    if (lowered.includes('failed to rename')) return t('instanceDetails.errors.renameFailed');
    if (lowered.includes('port conflict')) return t('instanceDetails.errors.portConflict');
    return text;
};

const LogViewer = ({ instance, t }) => {
    const [logs, setLogs] = useState([]);
    const [linesToFetch, setLinesToFetch] = useState(500);
    const [filterErrors, setFilterErrors] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [liveConnected, setLiveConnected] = useState(false);

    const containerRef = React.useRef(null);
    const eventSourceRef = React.useRef(null);

    const fetchHistory = async (lines) => {
        setLoading(true);
        try {
            const res = await api.get('/logs/server', { params: { instanceId: instance.id, lines } });
            const content = res.data.data.content || '';
            const newLines = content.split('\n');

            setLogs(newLines);
            setLoading(false);
        } catch (err) {
            toast.error(t('logs.errorLoadingOld'));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(500);
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_URL || '/api'}/logs/stream?instanceId=${instance.id}&token=${token}`;

        const es = new EventSource(url);

        es.onopen = () => {
            setLiveConnected(true);
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.line) {
                    setLogs(prev => [...prev, data.line]);
                }
            } catch (e) {
                console.error("SSE Parse Error", e);
            }
        };

        es.onerror = (err) => {
            console.error("SSE Error", err);
            es.close();
            setLiveConnected(false);
        };

        eventSourceRef.current = es;

        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, [instance.id]);

    useEffect(() => {
        if (autoScroll && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;

        if (scrollHeight - scrollTop - clientHeight > 50) {
            setAutoScroll(false);
        } else {
            setAutoScroll(true);
        }

        if (scrollTop === 0 && !loading && !fetchingHistory && linesToFetch < 10000) {
            setFetchingHistory(true);
            const oldHeight = scrollHeight;
            const newLimit = linesToFetch + 500;
            setLinesToFetch(newLimit);

            api.get('/logs/server', { params: { instanceId: instance.id, lines: newLimit } })
                .then(res => {
                    const content = res.data.data.content || '';
                    const allLines = content.split('\n');

                    setLogs(allLines);
                    requestAnimationFrame(() => {
                        if (containerRef.current) {
                            const newScrollHeight = containerRef.current.scrollHeight;
                            containerRef.current.scrollTop = newScrollHeight - oldHeight;
                        }
                    });
                })
                .finally(() => setFetchingHistory(false));
        }
    };

    const handleDownload = () => {
        const text = logs.join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${instance.name.replace(/\s+/g, '_')}_server.log`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const executeClear = async () => {
        try {
            await api.post('/logs/clear', { instanceId: instance.id, type: 'main' });
            toast.success(t('logs.clearSuccess') || 'Logs cleared');
            setLogs([]); // Clear immediately
            setLinesToFetch(500); // Reset history depth
            setConfirmAction(null);
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            if (msg && msg.toLowerCase().includes('already empty')) {
                toast.success(t('logs.alreadyEmpty') || 'Logs are already empty');
                setLogs([]);
                setConfirmAction(null);
            } else {
                toast.error(err.response?.data?.details || 'Failed to clear logs');
            }
        }
    };

    const handleClearRequest = () => {
        if (!logs || logs.length < 500) {
            executeClear();
        } else {
            setConfirmAction('clear');
        }
    };

    const displayedLogs = React.useMemo(() => {
        if (!logs) return [];
        let lines = logs;

        if (filterErrors) {
            lines = lines.filter(line => typeof line === 'string' && (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception') || line.toLowerCase().includes('failed')));
        }

        if (searchTerm) {
            lines = lines.filter(line => typeof line === 'string' && line.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return lines;
    }, [logs, filterErrors, searchTerm]);

    return (
        <div className="h-full flex flex-col relative">
            {/* Custom Confirm Dialog - Improved */}
            <AnimatePresence>
                {confirmAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-4 rounded-lg"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface border border-primary p-6 rounded-lg shadow-2xl max-w-md text-center w-full"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="bg-danger bg-opacity-30 p-4 rounded-full border border-danger border-opacity-50">
                                    <FaExclamationTriangle className="text-4xl text-danger" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-text mb-2">{t('logs.confirmClear')}</h3>
                            <p className="text-muted mb-6 text-sm bg-background p-3 rounded border border-border">
                                {t('logs.confirmDownload', { date: new Date().toLocaleString() })}
                            </p>

                            <div className="grid grid-cols-1 gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        handleDownload();
                                        executeClear();
                                    }}
                                    className="w-full flex items-center justify-center py-3"
                                >
                                    <FaDownload className="mr-2" /> {t('download')} & {t('logs.clear')}
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={executeClear}
                                    className="w-full flex items-center justify-center py-3"
                                >
                                    <FaTrash className="mr-2" /> {t('logs.clearLog')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmAction(null)}
                                    className="w-full flex items-center justify-center"
                                >
                                    {t('cancel')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-2 mb-2">
                {/* Header Controls */}
                <div className="flex justify-between items-center gap-4">
                    <span className="text-xs text-muted font-mono truncate flex-1 flex items-center gap-2">
                        {liveConnected && <span className="w-2 h-2 rounded-full bg-success animate-pulse" title="Live Streaming"></span>}
                        {instance.logPath ? instance.logPath.replace('/home/sysops', '~').replace('/home/pzadmin', '~') : 'Log Path Unknown'}
                        <span className="ml-2 opacity-70">({logs.length} lines)</span>
                    </span>
                    <div className="flex gap-2">
                        <input
                            className="bg-background border border-border rounded px-3 py-1 text-sm text-text focus:border-primary outline-none w-40"
                            placeholder={t('logs.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button
                            size="sm"
                            variant={filterErrors ? "warning" : "secondary"}
                            title={t('logs.showErrors') || "Show Errors Only"}
                            onClick={() => setFilterErrors(!filterErrors)}
                        >
                            <FaFilter className={filterErrors ? "text-red-900" : ""} /> {filterErrors && <FaExclamationTriangle className="ml-1 text-xs" />}
                        </Button>

                        {/* Auto-scroll toggle or status */}
                        <Button
                            size="sm"
                            variant={autoScroll ? "primary" : "secondary"}
                            onClick={() => setAutoScroll(!autoScroll)}
                            title="Auto-scroll"
                        >
                            {autoScroll ? <FaArrowDown className="text-white" /> : <FaArrowUp className="text-gray-400" />}
                        </Button>

                        <Button
                            size="sm"
                            variant="secondary"
                            title="Download Logs"
                            onClick={handleDownload}
                        >
                            <FaDownload />
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            title={t('logs.clearLog')}
                            onClick={handleClearRequest}
                        >
                            <FaTrash />
                        </Button>
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="bg-background text-primary font-mono text-xs p-4 rounded h-full overflow-auto shadow-inner border border-border relative"
            >
                {fetchingHistory && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center p-2 bg-background bg-opacity-80 z-10">
                        <FaSync className="animate-spin text-primary" /> <span className="ml-2 text-xs text-muted">Loading history...</span>
                    </div>
                )}

                {displayedLogs.length > 0 ? (
                    displayedLogs.map((line, i) => (
                        <div key={i} className="log-line whitespace-pre-wrap hover:bg-white/5 border-l-2 border-transparent pl-1">
                            {line}
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 italic text-center mt-10">
                        {loading ? "Loading logs..." : (t('logs.noLogs') || "No logs available.")}
                    </div>
                )}
            </div>
        </div>
    );
};

const InstanceDetailsModal = ({ isOpen, onClose, instance, onAction }) => {
    const { t } = useTranslation();
    const ui = React.useMemo(() => new Proxy({}, {
        get: (_, key) => t(`instanceDetails.${String(key)}`)
    }), [t]);
    const [activeTab, setActiveTab] = useState('controls');
    const [iniContent, setIniContent] = useState('');
    const [iniPath, setIniPath] = useState('');
    const [configType, setConfigType] = useState('ini'); // ini, sandbox, spawnpoints, spawnregions
    const [rconCommand, setRconCommand] = useState('');
    const [rconOutput, setRconOutput] = useState([]);
    const [consoleLoading, setConsoleLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [createBackup, setCreateBackup] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [quickMotd, setQuickMotd] = useState('');
    const [quickPort, setQuickPort] = useState('');
    const [quickIniLoading, setQuickIniLoading] = useState(false);
    const [quickIniSaving, setQuickIniSaving] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const configSearchRef = React.useRef(null);
    const textareaRef = React.useRef(null);
    const deleteTimerRef = React.useRef(null);

    const formatBytes = (bytes) => {
        if (!Number.isFinite(bytes) || bytes <= 0) return '-';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex += 1;
        }
        return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
    };

    const readIniValue = (content, key) => {
        const regex = new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'im');
        const match = String(content || '').match(regex);
        return match ? match[1].trim() : '';
    };

    const upsertIniValue = (content, key, value) => {
        const regex = new RegExp(`^(\\s*${key}\\s*=\\s*)(.*)$`, 'im');
        if (regex.test(content)) {
            return content.replace(regex, `$1${value}`);
        }
        const suffix = content.endsWith('\n') ? '' : '\n';
        return `${content}${suffix}${key}=${value}\n`;
    };

    useEffect(() => {
        if (isOpen && activeTab === 'config') fetchConfig();
    }, [isOpen, activeTab, instance.id, configType]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (activeTab === 'config' && (e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                configSearchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab]);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/config/ini', { params: { instanceId: instance.id, type: configType } });
            setIniContent(res.data.data.content);
            setIniPath(res.data.data.path);
        } catch (err) {
            toast.error(t('error') + ': ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSaveConfig = async () => {
        try {
            await api.put('/config/ini', { instanceId: instance.id, content: iniContent, type: configType });
            toast.success(t('config.saveChanges'));
        } catch (err) {
            toast.error(t('error') + ': ' + (err.response?.data?.message || err.message));
        }
    };

    const loadQuickIni = async () => {
        if (!isOpen || activeTab !== 'controls') return;
        setQuickIniLoading(true);
        try {
            const res = await api.get('/config/ini', { params: { instanceId: instance.id, type: 'ini' } });
            const content = res.data?.data?.content || '';
            setQuickMotd(readIniValue(content, 'PublicDescription'));
            setQuickPort(readIniValue(content, 'DefaultPort') || String(localInstance.gamePort || ''));
        } catch (err) {
            toast.error(ui.iniQuickLoadFailed);
        } finally {
            setQuickIniLoading(false);
        }
    };

    const applyQuickIni = async () => {
        setQuickIniSaving(true);
        try {
            const res = await api.get('/config/ini', { params: { instanceId: instance.id, type: 'ini' } });
            let content = res.data?.data?.content || '';

            content = upsertIniValue(content, 'PublicDescription', quickMotd || '');
            if (quickPort) {
                content = upsertIniValue(content, 'DefaultPort', quickPort);
            }

            await api.put('/config/ini', { instanceId: instance.id, type: 'ini', content });
            setLocalInstance((prev) => ({ ...prev, gamePort: Number(quickPort) || prev.gamePort }));
            toast.success(ui.iniQuickSaved);
        } catch (err) {
            toast.error(t('error') + ': ' + (err.response?.data?.message || err.message));
        } finally {
            setQuickIniSaving(false);
        }
    };

    const handleCreateBackup = async () => {
        setBackupLoading(true);
        try {
            await api.post('/commands', { action: 'backup' });
            toast.success(ui.backupStarted);
        } catch (err) {
            toast.error(err.response?.data?.message || ui.backupFailed);
        } finally {
            setBackupLoading(false);
        }
    };

    const handleRconSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!rconCommand) return;

        setConsoleLoading(true);
        setRconOutput(prev => [...prev, { type: 'input', text: `> ${rconCommand}` }]);

        try {
            const res = await api.post('/commands', { action: 'rcon', command: rconCommand, instanceId: instance.id });
            setRconOutput(prev => [...prev, { type: 'output', text: res.data.output }]);
            setRconCommand('');
        } catch (err) {
            setRconOutput(prev => [...prev, { type: 'error', text: err.response?.data?.message || 'Command failed' }]);
        } finally {
            setConsoleLoading(false);
        }
    };

    const [localInstance, setLocalInstance] = useState(instance);
    const [forceDeletePrompt, setForceDeletePrompt] = useState(false);

    const handleToggleLock = async () => {
        try {
            const nextLocked = !Boolean(localInstance.isLocked);
            await api.patch(`/instances/${localInstance.id}`, { isLocked: nextLocked });
            setLocalInstance(prev => ({ ...prev, isLocked: nextLocked }));
            toast.success(ui.lockUpdated);
        } catch (err) {
            toast.error(ui.lockUpdateFailed);
        }
    };

    const executeDeleteInstance = async (force = false) => {
        setDeleting(true);
        try {
            const res = await api.delete(`/instances/${localInstance.id}`, { data: { createBackup, force } });
            if (res.data.success) {
                toast.success(ui.deleteSuccess);
                setShowDeleteConfirm(false);
                setForceDeletePrompt(false);
                onClose();
                if (onAction) onAction({ stopPropagation: () => {} }, localInstance.id, 'refresh');
            }
        } catch (err) {
            const errorMsg = translateInstanceError(err.response?.data?.message || err.message || 'Failed to delete instance', t);
            toast.error(errorMsg);
            if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('accessible')) {
                setForceDeletePrompt(true);
            }
        } finally {
            setDeleting(false);
            setPendingDelete(null);
        }
    };

    const scheduleDeleteInstance = (force = false) => {
        if (localInstance.isLocked) {
            toast.error(ui.lockDeleteHint);
            return;
        }

        if (deleteTimerRef.current) {
            clearTimeout(deleteTimerRef.current);
            deleteTimerRef.current = null;
        }

        setPendingDelete({ force });
        setShowDeleteConfirm(false);
        setForceDeletePrompt(false);

        const toastId = `delete-undo-${localInstance.id}`;
        toast((toastObj) => (
            <div className="flex items-center gap-3">
                <span className="text-sm">{ui.deleteInFiveSeconds}</span>
                <button
                    type="button"
                    className="px-2 py-1 rounded border border-border bg-background text-xs hover:border-primary"
                    onClick={() => {
                        if (deleteTimerRef.current) {
                            clearTimeout(deleteTimerRef.current);
                            deleteTimerRef.current = null;
                        }
                        setPendingDelete(null);
                        toast.dismiss(toastObj.id);
                        toast.success(ui.deleteCanceled);
                    }}
                >
                    {ui.undo}
                </button>
            </div>
        ), { id: toastId, duration: 5000 });

        deleteTimerRef.current = setTimeout(() => {
            deleteTimerRef.current = null;
            void executeDeleteInstance(force);
            toast.dismiss(toastId);
        }, 5000);
    };

    useEffect(() => {
        return () => {
            if (deleteTimerRef.current) {
                clearTimeout(deleteTimerRef.current);
                deleteTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        setLocalInstance(instance);
    }, [instance]);

    useEffect(() => {
        let interval;
        if (isOpen && activeTab === 'controls') {
            const fetchStatus = async () => {
                try {
                    const res = await api.get('/instances');
                    const found = res.data.data.find(i => i.id === instance.id);
                    if (found) setLocalInstance(found);
                } catch (_e) {
                    return;
                }
            };
            fetchStatus();
            interval = setInterval(fetchStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [isOpen, activeTab, instance.id]);

    useEffect(() => {
        void loadQuickIni();
    }, [isOpen, activeTab, instance.id]);

    const renderConfigTab = () => (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 gap-4">
                <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-xs text-muted font-mono truncate">
                        {iniPath ? iniPath.replace('/home/sysops', '~').replace('/home/pzadmin', '~') : ui.configPathUnknown}
                    </span>
                </div>

                <div className="flex gap-2 items-center">
                    <select
                        className="bg-background border border-border rounded px-2 py-1 text-sm text-text focus:border-primary outline-none"
                        value={configType}
                        onChange={(e) => setConfigType(e.target.value)}
                    >
                        <option value="ini">Server Config (INI)</option>
                        <option value="sandbox">Sandbox Vars (Lua)</option>
                        <option value="spawnpoints">Spawn Points (Lua)</option>
                        <option value="spawnregions">Spawn Regions (Lua)</option>
                    </select>

                    <input
                        ref={configSearchRef}
                        id="config-search"
                        className="bg-background border border-border rounded px-3 py-1 text-sm text-text focus:border-primary outline-none w-48"
                        placeholder={ui.findPlaceholder}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const term = e.target.value.toLowerCase();
                                const textarea = textareaRef.current;
                                if (!textarea || !term) return;

                                const content = textarea.value.toLowerCase();
                                let startPos = textarea.selectionEnd;
                                let index = content.indexOf(term, startPos);
                                if (index === -1) {
                                    index = content.indexOf(term, 0);
                                }

                                if (index !== -1) {
                                    textarea.focus();
                                    textarea.setSelectionRange(index, index + term.length);
                                    const textBefore = content.substring(0, index);
                                    const linesBefore = textBefore.split('\n').length;
                                    const lineHeight = 20;
                                    const scrollPos = linesBefore * lineHeight - (textarea.clientHeight / 2);
                                    textarea.scrollTop = scrollPos;
                                } else {
                                    toast.error(ui.notFound);
                                }
                            }
                        }}
                    />
                    <Button size="sm" onClick={handleSaveConfig}><FaSave className="mr-1" /> {t('save')}</Button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden border border-border rounded bg-background">
                <div className="bg-surfaceAlt text-muted p-4 text-right font-mono text-sm select-none border-r border-border overflow-hidden w-12 pt-4">
                    {iniContent.split('\n').map((_, i) => (
                        <div key={i} className="h-[20px] leading-[20px]">{i + 1}</div>
                    ))}
                </div>
                <textarea
                    ref={textareaRef}
                    id="config-textarea"
                    className="flex-1 bg-background text-text font-mono text-sm p-4 outline-none resize-none whitespace-pre leading-[20px]"
                    value={iniContent}
                    onChange={(e) => setIniContent(e.target.value)}
                    spellCheck={false}
                    onScroll={(e) => {
                        e.target.previousSibling.scrollTop = e.target.scrollTop;
                    }}
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface border border-border w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-border bg-surfaceAlt">
                    <div className="flex items-center space-x-4">
                        <div className="group/edit min-w-0">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleToggleLock}
                                    title={localInstance.isLocked ? ui.lockDisable : ui.lockEnable}
                                    className={`p-2 rounded border transition-colors ${localInstance.isLocked ? 'bg-warning text-onWarning border-warning' : 'bg-surfaceAlt text-muted border-border hover:text-text'}`}
                                >
                                    {localInstance.isLocked ? <FaLock /> : <FaLockOpen />}
                                </button>
                                <input
                                    className="text-xl font-bold text-text bg-transparent border-b border-transparent hover:border-muted focus:border-primary outline-none w-full"
                                    defaultValue={localInstance.name}
                                    onBlur={async (e) => {
                                        if (e.target.value !== localInstance.name) {
                                            try {
                                                await api.patch(`/instances/${localInstance.id}`, { name: e.target.value });
                                                toast.success(ui.renameSuccess);
                                            } catch (err) {
                                                toast.error(translateInstanceError('Failed to rename', t));
                                            }
                                        }
                                    }}
                                />
                                
                                {localInstance.running ? ( <Badge variant="success">{ui.running}</Badge> ) : ( <Badge variant="warning">{ui.stopped}</Badge> )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-mono">
                                <span className="instance-meta-chip">PID: {localInstance.pid || '-'}</span>
                                <span className="instance-meta-chip">{ui.udpLabel}: {localInstance.gamePort || '-'}</span>
                                <span className="instance-meta-chip">{ui.rconLabel}: {localInstance.rconPort || '-'}</span>
                                <span className="instance-meta-chip">{ui.branchLabel}: {localInstance.version || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {localInstance.running ? (
                            <Button
                                variant="warning"
                                size="sm"
                                onClick={(e) => onAction(e, localInstance.id, 'stop')}
                                title={ui.quickStop}
                                className="px-3"
                            >
                                <FaStop />
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => onAction(e, localInstance.id, 'start')}
                                title={ui.quickStart}
                                className="px-3"
                            >
                                <FaPlay />
                            </Button>
                        )}
                        <div title={localInstance.isLocked ? ui.lockDeleteHint : ''}>
                            <Button
                                variant="danger"
                                size="sm"
                                disabled={Boolean(localInstance.isLocked)}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <FaTrash className="mr-1" /> {ui.deleteLabel}
                            </Button>
                        </div>
                        <button onClick={onClose} className="text-muted hover:text-text transition-colors">
                            <FaTimes className="text-2xl" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-surfaceAlt border-b border-border px-4">
                    {['controls', 'logs', 'config', 'console', 'mods'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-semibold uppercase tracking-wider transition-colors
                   ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-text'}
                `}
                        >
                            {t(`instances.${tab}`)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-background">
                    {activeTab === 'controls' && (
                        // ... Controls Tab ...
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <h3 className="text-lg font-bold text-text mb-4">{t('instances.instanceStatus')}</h3>
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                                        <span className="text-muted font-medium">{t('instances.state')}</span>
                                        {localInstance.running ? (
                                            <Badge variant="success">{ui.running}</Badge>
                                        ) : (
                                            <Badge variant="warning">{ui.stopped}</Badge>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                                        <span className="text-muted">{t('instances.pid')}:</span>
                                        <span className="font-mono text-text">{localInstance.pid || '-'}</span>
                                    </div>
                                    {!localInstance.running && (
                                        <div className="flex justify-between">
                                            <span className="text-muted">{t('instances.lastStop')}:</span>
                                            <span className="text-danger">{localInstance.shutdownReason || '-'}</span>
                                        </div>
                                    )}
                                    {localInstance.running && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">{ui.processUsageLabel}:</span>
                                            <span className="font-mono text-text">
                                                {ui.cpuLabel} {Number.isFinite(localInstance.processCpuPercent) ? `${localInstance.processCpuPercent.toFixed(1)}%` : '-'} | {ui.memoryLabel} {formatBytes(localInstance.processMemoryBytes)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                            <Card>
                                <h3 className="text-lg font-bold text-text mb-4">{t('instances.controls')}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="primary"
                                        disabled={localInstance.running}
                                        onClick={(e) => onAction(e, localInstance.id, 'start')}
                                        className="flex items-center justify-center py-4"
                                    >
                                        <FaPlay className="mr-2" /> {t('instances.play')}
                                    </Button>
                                    <Button
                                        variant="danger"
                                        disabled={!localInstance.running}
                                        onClick={(e) => onAction(e, localInstance.id, 'stop')}
                                        className="flex items-center justify-center py-4"
                                    >
                                        <FaStop className="mr-2" /> {t('instances.stop')}
                                    </Button>
                                    <Button
                                        variant="warning"
                                        disabled={!localInstance.running}
                                        onClick={(e) => onAction(e, localInstance.id, 'restart')}
                                        className="flex items-center justify-center py-4"
                                    >
                                        <FaRedo className="mr-2" /> {t('instances.reboot')}
                                    </Button>
                                    <Button
                                        variant="danger"
                                        disabled={!localInstance.running}
                                        onClick={(e) => onAction(e, localInstance.id, 'kill')}
                                        className="flex items-center justify-center py-4 border-2 border-danger animate-pulse bg-danger bg-opacity-40"
                                    >
                                        <FaSkull className="mr-2" /> {t('instances.kill')}
                                    </Button>
                                    {!localInstance.running && (localInstance.broken || localInstance.installationStatus === 'failed' || localInstance.shutdownReason === 'installation_failed') && (
                                        <Button
                                            variant="warning"
                                            onClick={(e) => onAction(e, localInstance.id, 'retry-install')}
                                            className="col-span-2 flex items-center justify-center py-4"
                                        >
                                            <FaRedo className="mr-2" /> {ui.retryInstall}
                                        </Button>
                                    )}
                                </div>
                                {pendingDelete && (
                                    <p className="mt-3 text-xs text-warning">
                                        {ui.deleteScheduled}
                                    </p>
                                )}
                            </Card>
                            <Card>
                                <h3 className="text-lg font-bold text-text mb-4">{ui.quickToolsTitle}</h3>
                                <div className="mb-4 flex items-center justify-between rounded border border-border bg-surfaceAlt p-3">
                                    <span className="text-sm text-muted">{ui.lockLabel}</span>
                                    <button
                                        type="button"
                                        onClick={handleToggleLock}
                                        title={localInstance.isLocked ? ui.lockDisable : ui.lockEnable}
                                        className={`setting-switch ${localInstance.isLocked ? 'setting-switch-on' : ''}`}
                                    >
                                        <span className="setting-switch-thumb" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <Button
                                        variant="secondary"
                                        onClick={handleCreateBackup}
                                        disabled={backupLoading}
                                        className="w-full flex items-center justify-center"
                                    >
                                        <FaSave className="mr-2" /> {backupLoading ? t('loading') : ui.backupNow}
                                    </Button>
                                </div>
                            </Card>
                            <Card>
                                <h3 className="text-lg font-bold text-text mb-4">{ui.iniQuickTitle}</h3>
                                <div className="rounded border border-border bg-surfaceAlt p-3">
                                    <div className="grid grid-cols-1 gap-2">
                                        <input
                                            className="bg-background border border-border rounded px-3 py-2 text-sm text-text focus:border-primary outline-none"
                                            placeholder={ui.motdLabel}
                                            value={quickMotd}
                                            onChange={(e) => setQuickMotd(e.target.value)}
                                            disabled={quickIniLoading || quickIniSaving}
                                        />
                                        <input
                                            type="number"
                                            className="bg-background border border-border rounded px-3 py-2 text-sm text-text focus:border-primary outline-none"
                                            placeholder={ui.serverPortLabel}
                                            value={quickPort}
                                            onChange={(e) => setQuickPort(e.target.value)}
                                            disabled={quickIniLoading || quickIniSaving}
                                        />
                                        <Button
                                            variant="primary"
                                            onClick={applyQuickIni}
                                            disabled={quickIniLoading || quickIniSaving}
                                            className="w-full"
                                        >
                                            {quickIniSaving ? t('loading') : ui.applyIniQuick}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'logs' && <LogViewer instance={localInstance} t={t} />}

                    {activeTab === 'config' && renderConfigTab()}

                    {activeTab === 'console' && (
                        // ... Console Tab ...
                        <div className="h-full flex flex-col">
                            <div className="flex-1 bg-background text-text font-mono text-sm p-4 rounded mb-4 overflow-auto border border-border shadow-inner">
                                {rconOutput.map((line, i) => (
                                    <div key={i} className={`${line.type === 'input' ? 'text-primary' : line.type === 'error' ? 'text-danger' : 'text-success'}`}>
                                        {line.text}
                                    </div>
                                ))}
                                {rconOutput.length === 0 && <span className="text-muted opacity-50">{ui.rconReady}</span>}
                            </div>
                            <div className="flex gap-2 mb-2">
                                <Button size="sm" variant="secondary" onClick={() => { setRconCommand('save'); handleRconSubmit({ preventDefault: () => { } }); }}>
                                    <FaSave className="mr-1" /> {ui.saveQuick}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => { setRconCommand('players'); handleRconSubmit({ preventDefault: () => { } }); }}>
                                    <FaUsers className="mr-1" /> {ui.playersQuick}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => {
                                    const msg = prompt(ui.broadcastPrompt);
                                    if (msg) { setRconCommand(`servermsg "${msg}"`); handleRconSubmit({ preventDefault: () => { } }); }
                                }}>
                                    <FaBullhorn className="mr-1" /> {ui.broadcastQuick}
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => {
                                    if (confirm(ui.quitConfirm)) {
                                        setRconCommand('quit'); handleRconSubmit({ preventDefault: () => { } });
                                    }
                                }}>
                                    <FaPowerOff className="mr-1" /> {ui.quitQuick}
                                </Button>
                            </div>
                            <form onSubmit={handleRconSubmit} className="flex gap-2">
                                <input
                                    className="flex-1 bg-surfaceAlt text-text font-mono px-4 py-2 rounded border border-border focus:border-primary outline-none"
                                    placeholder={t('instances.rconPlaceholder')}
                                    value={rconCommand}
                                    onChange={(e) => setRconCommand(e.target.value)}
                                    disabled={consoleLoading}
                                />
                                <Button type="submit" disabled={consoleLoading}>{t('instances.send')}</Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'mods' && <ModsManager instanceId={localInstance.id} />}
                </div>
            </motion.div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface border border-danger p-6 rounded-lg shadow-2xl max-w-md w-full"
                        >
                            <h3 className="text-xl font-bold text-danger mb-4 flex items-center">
                                <FaExclamationTriangle className="mr-2" />
                                {ui.deleteTitle}
                            </h3>
                            <div className="text-text space-y-4 mb-6">
                                <p>
                                    {ui.deleteQuestion} <strong>{localInstance.name}</strong>?
                                </p>
                                <p className="text-sm text-muted">
                                    {ui.deleteImpact}
                                </p>
                                <div className="bg-background p-4 rounded border border-border flex items-center cursor-pointer" onClick={() => setCreateBackup(!createBackup)}>
                                    <input 
                                        type="checkbox" 
                                        className="mr-3 w-5 h-5 accent-primary cursor-pointer" 
                                        checked={createBackup} 
                                        onChange={() => setCreateBackup(!createBackup)} 
                                    />
                                    <div>
                                        <span className="font-bold text-text block">{t('instances.backupBeforeDelete')}</span>
                                        <span className="text-xs text-muted">{ui.backupHint}</span>
                                    </div>
                                </div>
                                {forceDeletePrompt && (
                                    <div className="bg-danger bg-opacity-10 border border-danger p-3 rounded text-danger text-sm">
                                        <p className="font-bold">{ui.forceDeleteWarning}</p>
                                        <p>{ui.forceDeleteExplain}</p>
                                    </div>
                                )}
                                {localInstance.isLocked && (
                                    <div className="bg-warning bg-opacity-10 border border-warning p-3 rounded text-warning text-sm">
                                        <p className="font-bold">{ui.lockLabel}</p>
                                        <p>{ui.lockDeleteHint}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3">
                                <Button variant="secondary" onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setForceDeletePrompt(false);
                                }} disabled={deleting}>
                                    {t('cancel')}
                                </Button>
                                {forceDeletePrompt ? (
                                    <Button variant="danger" onClick={() => scheduleDeleteInstance(true)} disabled={deleting || Boolean(localInstance.isLocked)}>
                                        {deleting ? ui.deleting : ui.forceDelete}
                                    </Button>
                                ) : (
                                    <Button variant="danger" onClick={() => scheduleDeleteInstance(false)} disabled={deleting || Boolean(localInstance.isLocked)}>
                                        {deleting ? ui.deleting : ui.confirmDelete}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InstanceDetailsModal;
