import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaServer, FaPlay, FaStop, FaRedo, FaSkull, FaSave, FaPuzzlePiece, FaUsers, FaBullhorn, FaPowerOff, FaDownload, FaTrash, FaSync, FaArrowUp, FaArrowDown, FaFilter, FaExclamationTriangle } from 'react-icons/fa';
import { Button, Card, Badge } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n/index.jsx';
import ModsManager from './ModsManager';

const LogViewer = ({ instance, t }) => {
    const [logs, setLogs] = useState([]);
    const [linesToFetch, setLinesToFetch] = useState(500);
    const [filterErrors, setFilterErrors] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false); // For overlap/gap check
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [liveConnected, setLiveConnected] = useState(false);

    const containerRef = React.useRef(null);
    const eventSourceRef = React.useRef(null);
    const scrollPosRef = React.useRef(0);

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

    // Initial Load & SSE Setup
    useEffect(() => {
        // Initial fetch of recent history
        fetchHistory(500);

        // Setup SSE for live updates
        const token = localStorage.getItem('token');
        // Note: EventSource doesn't support headers natively easily. 
        // We might need to pass token in query param or rely on cookie if used. 
        // Assuming token authentication via query param for SSE or specialized polyfill.
        // For simplicity providing token in query. Ensure backend VerifyToken checks query.

        // Let's modify backend verification or use a polyfill? 
        // If Auth middleware only checks header, this will fail.
        // Let's assume user is authenticated via session or we pass token in URL.
        const url = `${import.meta.env.VITE_API_URL || '/api'}/logs/stream?instanceId=${instance.id}&token=${token}`;

        const es = new EventSource(url);

        es.onopen = () => {
            setLiveConnected(true);
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.line) {
                    setLogs(prev => {
                        // Prevent duplicates if already fetched via REST? 
                        // It's tricky. tail -f starts from NOW.
                        return [...prev, data.line];
                    });
                }
            } catch (e) {
                console.error("SSE Parse Error", e);
            }
        };

        es.onerror = (err) => {
            console.error("SSE Error", err);
            es.close();
            setLiveConnected(false);
            // Retry? logic usually built-in but good to handle manually for token refresh
        };

        eventSourceRef.current = es;

        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, [instance.id]);

    // Auto-scroll effect
    useEffect(() => {
        if (autoScroll && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;

        // Detect if user scrolled up manually -> disable auto-scroll
        if (scrollHeight - scrollTop - clientHeight > 50) {
            setAutoScroll(false);
        } else {
            setAutoScroll(true);
        }

        // Infinite Scroll Up (Load History)
        if (scrollTop === 0 && !loading && !fetchingHistory && linesToFetch < 10000) {
            setFetchingHistory(true);
            const oldHeight = scrollHeight;
            const newLimit = linesToFetch + 500;
            setLinesToFetch(newLimit);

            // Fetch older logs
            api.get('/logs/server', { params: { instanceId: instance.id, lines: newLimit } })
                .then(res => {
                    const content = res.data.data.content || '';
                    const allLines = content.split('\n');

                    // We replace the current logs with the larger set
                    // But we must preserve the "new" lines that came in via SSE if any?
                    // This is complex. The simple "fetch N lines" usually overwrites.
                    // For now, let's just update the list. The SSE appends to *state*. 
                    // This might cause a jump or overwrite of live logs if not careful.
                    // Ideally: Fetch History returns lines *before* current head.
                    // Given our backend returns "tail N", re-fetching N+500 covers the overlap.

                    setLogs(allLines);

                    // Restore scroll position
                    // We need to wait for render?
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
        // If small (approx < 500 lines), just clear without nagging
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
                        <div key={i} className="log-line whitespace-pre-wrap hover:bg-white/5 border-l-2 border-transparent hover:border-gray-700 pl-1">
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
    const configSearchRef = React.useRef(null);
    const textareaRef = React.useRef(null);

    useEffect(() => {
        if (isOpen && activeTab === 'config') fetchConfig();
        // Reset config type on open?
        // if (isOpen) setConfigType('ini'); 
    }, [isOpen, activeTab, instance.id, configType]);

    // Ctrl+F Handler
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
            toast.error(t('error') + ': ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSaveConfig = async () => {
        try {
            await api.put('/config/ini', { instanceId: instance.id, content: iniContent, type: configType });
            toast.success(t('config.saveChanges'));
        } catch (err) {
            toast.error(t('error') + ': ' + (err.response?.data?.error || err.message));
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
            setRconOutput(prev => [...prev, { type: 'error', text: err.response?.data?.error || 'Command failed' }]);
        } finally {
            setConsoleLoading(false);
        }
    };

    // ... (rest of RCON and Render logic)

    // Auto-refresh stats/status when open
    useEffect(() => {
        let interval;
        if (isOpen && activeTab === 'controls') {
            interval = setInterval(async () => {
                try {
                    const res = await api.get('/instances');
                    const instances = res.data.data;
                    const current = instances.find(i => i.id === instance.id);
                    if (current && onAction) {
                        // We can't easily mutate "instance" prop as it comes from parent.
                        // But we can trigger a parent refresh or use local state if we want to show updated status immediately.
                        // Ideally, the parent "Dashboard" is the one fetching instances.
                        // If Dashboard isn't polling, we won't see updates.
                        // The user asked to update "status".
                        // We can abuse onAction to tell parent to "refresh"? Or just rely on parent polling?
                        // If parent doesn't poll, we can't update the prop "instance" from here.
                        // Wait, onAction is usually for control. 

                        // Hack: Create local state for display, initialize with prop, update with poll.
                    }
                } catch (e) { /* ignore */ }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isOpen, activeTab, instance.id]);

    // Better approach:
    // Create local state merged with prop
    const [localInstance, setLocalInstance] = useState(instance);

    const handleDeleteInstance = async () => {
        setDeleting(true);
        try {
            const res = await api.delete(`/instances/${localInstance.id}`, { data: { createBackup } });
            if (res.data.success) {
                toast.success('Instance deleted successfully');
                onClose();
                // We should ideally trigger a refresh on the parent Dashboard
                // Since onAction is used for start/stop, we can call it with 'refresh' or just rely on auto-polling.
                // For immediate feedback, we simulate a click on an external refresh button or just let Dashboard poll.
                if (onAction) onAction({ stopPropagation: () => {} }, localInstance.id, 'refresh');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Failed to delete instance');
        } finally {
            setDeleting(false);
        }
    };

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
                } catch (e) {
                    // ignore
                }
            };
            fetchStatus();
            interval = setInterval(fetchStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [isOpen, activeTab, instance.id]);

    // Replaced all usages of `instance.` with `localInstance.` in the Render where status matters (Controls Tab)
    // Actually, let's just use localInstance everywhere inside the modal for consistency.

    const renderConfigTab = () => (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 gap-4">
                <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-xs text-muted font-mono truncate">
                        {iniPath ? iniPath.replace('/home/sysops', '~').replace('/home/pzadmin', '~') : 'Config Path Unknown'}
                    </span>
                </div>

                <div className="flex gap-2 items-center">
                    {/* File Type Selector */}
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
                        placeholder="Find (Ctrl+F)..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault(); // Prevent accidental form submit or newline
                                const term = e.target.value.toLowerCase();
                                const textarea = textareaRef.current;
                                if (!textarea || !term) return;

                                const content = textarea.value.toLowerCase();
                                // Find next occurrence from current position
                                let startPos = textarea.selectionEnd;
                                let index = content.indexOf(term, startPos);

                                // Wrap around
                                if (index === -1) {
                                    index = content.indexOf(term, 0);
                                }

                                if (index !== -1) {
                                    textarea.focus();
                                    textarea.setSelectionRange(index, index + term.length);
                                    // Scroll to view logic
                                    // Calculate lines before index
                                    const textBefore = content.substring(0, index);
                                    const linesBefore = textBefore.split('\n').length;
                                    const lineHeight = 20;
                                    const scrollPos = linesBefore * lineHeight - (textarea.clientHeight / 2);
                                    textarea.scrollTop = scrollPos;
                                } else {
                                    toast.error('Not found');
                                }
                            }
                        }}
                    />
                    <Button size="sm" onClick={handleSaveConfig}><FaSave className="mr-1" /> {t('save')}</Button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden border border-border rounded bg-background">
                {/* Line Numbers */}
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
                        // Sync line numbers scroll
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
                        <div className="p-3 bg-background rounded-lg border border-border">
                            <FaServer className="text-primary text-2xl" />
                        </div>
                        <div className="group/edit">
                            <input
                                className="text-xl font-bold text-text bg-transparent border-b border-transparent hover:border-muted focus:border-primary outline-none w-full"
                                defaultValue={localInstance.name}
                                onBlur={async (e) => {
                                    if (e.target.value !== localInstance.name) {
                                        try {
                                            await api.patch(`/instances/${localInstance.id}`, { name: e.target.value });
                                            toast.success('Instance renamed');
                                        } catch (err) {
                                            toast.error('Failed to rename');
                                        }
                                    }
                                }}
                            />
                            <p className="text-xs text-muted font-mono">{localInstance.id} | {localInstance.gamePort}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                            <FaTrash className="mr-1" /> Eliminar
                        </Button>
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
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${localInstance.running ? 'bg-success bg-opacity-20 text-success border border-success' : 'bg-surfaceAlt text-muted border border-border'}`}>
                                            {localInstance.running ? 'RUNNING' : 'STOPPED'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                                        <span className="text-muted">{t('instances.pid')}:</span>
                                        <span className="font-mono text-text">{localInstance.pid || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">{t('instances.lastStop')}:</span>
                                        <span className="text-danger">{localInstance.shutdownReason || '-'}</span>
                                    </div>
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
                                {rconOutput.length === 0 && <span className="text-muted opacity-50">RCON Console Ready.</span>}
                            </div>
                            <div className="flex gap-2 mb-2">
                                <Button size="sm" variant="secondary" onClick={() => { setRconCommand('save'); handleRconSubmit({ preventDefault: () => { } }); }}>
                                    <FaSave className="mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => { setRconCommand('players'); handleRconSubmit({ preventDefault: () => { } }); }}>
                                    <FaUsers className="mr-1" /> Players
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => {
                                    const msg = prompt('Enter message to broadcast:');
                                    if (msg) { setRconCommand(`servermsg "${msg}"`); handleRconSubmit({ preventDefault: () => { } }); }
                                }}>
                                    <FaBullhorn className="mr-1" /> Broadcast
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => {
                                    if (confirm('Are you sure you want to stop the server via RCON?')) {
                                        setRconCommand('quit'); handleRconSubmit({ preventDefault: () => { } });
                                    }
                                }}>
                                    <FaPowerOff className="mr-1" /> Quit
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
                                Eliminar Instancia
                            </h3>
                            <div className="text-text space-y-4 mb-6">
                                <p>
                                    ¿Estás seguro de que deseas eliminar la instancia <strong>{localInstance.name}</strong>?
                                </p>
                                <p className="text-sm text-muted">
                                    Esta acción detendrá el servidor si está corriendo y eliminará sus archivos.
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
                                        <span className="text-xs text-muted">Respalda archivos .ini, .db y saves de los mundos.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                                    Cancelar
                                </Button>
                                <Button variant="danger" onClick={handleDeleteInstance} disabled={deleting}>
                                    {deleting ? 'Eliminando...' : 'Sí, Eliminar Instancia'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InstanceDetailsModal;
