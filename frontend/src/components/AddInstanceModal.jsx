import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaServer, FaCheck, FaSpinner, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { Button } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n/index.jsx';

const getLogTone = (log) => {
    const text = String(log || '').toLowerCase();
    if (text.includes('[error]') || text.includes(' error:') || text.includes('install_failed') || text.includes('failed')) {
        return 'text-red-400';
    }
    if (text.includes('[warn]') || text.includes('warn:')) {
        return 'text-yellow-300';
    }
    if (text.includes('[queue]')) {
        return 'text-cyan-300';
    }
    if (text.includes('[instances.create]')) {
        return 'text-zombie-green';
    }
    return 'text-text';
};

const translateInstallError = (message, t) => {
    const text = String(message || '').trim();
    if (!text) return t('addInstanceModal.errors.unknown');

    const lowered = text.toLowerCase();
    if (lowered.includes('port conflict') || lowered.includes('conflicto de puertos')) {
        return t('addInstanceModal.errors.portConflict');
    }
    if (lowered.includes('steamcmd') && lowered.includes('not installed')) {
        return t('addInstanceModal.errors.steamcmdMissing');
    }
    if (lowered.includes('permission denied')) {
        return t('addInstanceModal.errors.permissionDenied');
    }
    if (lowered.includes('already exists')) {
        return t('addInstanceModal.errors.alreadyExists');
    }
    if (lowered.includes('failed to start setup script')) {
        return t('addInstanceModal.errors.failedSetupScript');
    }
    return text;
};

const AddInstanceModal = ({ isOpen, onClose, onInstanceAdded, onInstallQueued, onInstallFailed }) => {
    const { t } = useTranslation();
    const ui = React.useMemo(() => new Proxy({}, {
        get: (_, key) => t(`addInstanceModal.${String(key)}`)
    }), [t]);
    const getStatusLabel = (status) => {
        const normalized = String(status || '').toLowerCase();
        const lookup = {
            pending: 'statusPending',
            running: 'statusRunning',
            success: 'statusSuccess',
            failed: 'statusFailed'
        };
        const key = lookup[normalized];
        return key ? ui[key] : status;
    };
    const [formData, setFormData] = useState({
        name: '',
        branch: '',
        gamePort: '',
        rconPort: '',
        path: '',
        serviceName: '',
        pzName: '',
        iniPath: '',
        savePath: '',
        dbPath: ''
    });
    const [mode, setMode] = useState('install');
    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState([]);
    const [versionsSource, setVersionsSource] = useState(null);
    const [versionsError, setVersionsError] = useState(null);
    const [manualBranch, setManualBranch] = useState('');
    const [fetchingVersions, setFetchingVersions] = useState(false);
    const [conflictData, setConflictData] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [taskProgress, setTaskProgress] = useState({ status: 'pending', progress: 0, logs: [], metadata: {} });
    const [showTaskLogs, setShowTaskLogs] = useState(true);

    const fetchVersions = async () => {
        setFetchingVersions(true);
        setVersionsError('');

        try {
            const res = await api.get('/instances/versions');
            if (res.data.success) {
                const nextVersions = Array.isArray(res.data.data) ? res.data.data : [];
                setVersions(nextVersions);
                setVersionsSource(res.data.source || null);

                if (nextVersions.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        branch: prev.branch && nextVersions.some(v => v.id === prev.branch)
                            ? prev.branch
                            : nextVersions.find(v => v.default)?.id || nextVersions[0].id
                    }));
                } else {
                    setFormData(prev => ({ ...prev, branch: '' }));
                    setVersionsError(ui.noVersions);
                }
            } else {
                setVersions([]);
                setFormData(prev => ({ ...prev, branch: '' }));
                setVersionsError(ui.couldNotLoad);
            }
        } catch (error) {
            setVersions([]);
            setFormData(prev => ({ ...prev, branch: '' }));
            setVersionsError(error.response?.data?.message || ui.couldNotLoadBackend);
            toast.error(ui.fetchBranchesError);
        } finally {
            setFetchingVersions(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            void fetchVersions();
            setMode('install');
            setConflictData(null);
            setTaskId(null);
            setTaskProgress({ status: 'pending', progress: 0, logs: [], metadata: {} });
            setShowTaskLogs(true);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!taskId) return;

        let timer = null;
        let terminalSeen = false;

        const pollTask = async () => {
            try {
                const res = await api.get(`/instances/tasks/${taskId}`);
                if (res.data?.success) {
                    const task = res.data.data;
                    setTaskProgress(task);

                    if (task.status === 'success') {
                        setLoading(false);
                        onInstanceAdded?.();
                        if (!terminalSeen) {
                            toast.success(ui.readyToast, { id: 'instance-install-status' });
                        }
                        terminalSeen = true;
                        if (timer) clearInterval(timer);
                        timer = null;
                    }

                    if (task.status === 'failed') {
                        setLoading(false);
                        setShowTaskLogs(false);
                        if (!terminalSeen) {
                            toast.custom((toastState) => (
                                <div className="max-w-sm rounded-lg border border-border bg-surface shadow-xl px-4 py-3 text-sm text-text">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-danger">
                                                {ui.failedToastTitle}
                                            </p>
                                            <p className="text-muted mt-1">
                                                {ui.failedToastBody}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toast.dismiss(toastState.id)}
                                            className="text-muted hover:text-text transition-colors"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onInstallFailed?.(task);
                                                toast.dismiss(toastState.id);
                                            }}
                                            className="px-3 py-2 rounded border border-primary text-primary hover:bg-primary hover:text-onPrimary transition-colors"
                                        >
                                            {ui.viewLogs}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toast.dismiss(toastState.id)}
                                            className="px-3 py-2 rounded border border-border text-muted hover:text-text hover:border-primary transition-colors"
                                        >
                                            {ui.dismiss}
                                        </button>
                                    </div>
                                </div>
                            ), { id: 'instance-install-status' });
                        }
                        onInstallFailed?.(task);
                        terminalSeen = true;
                        if (timer) clearInterval(timer);
                        timer = null;
                    }
                }
            } catch (err) {
                console.error('Failed to poll task', err);
            }
        };

        void pollTask();
        timer = setInterval(() => {
            void pollTask();
        }, 2000);

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [taskId, onInstanceAdded]);

    const handleSubmit = async (e, force = false) => {
        const handleConflict = (err) => {
            if (err.response?.data?.code === 'PORT_CONFLICT') {
                setConflictData({ conflicts: err.response.data.conflicts || [] });
                setLoading(false);
            } else {
                toast.error(translateInstallError(err.response?.data?.message || t('error'), t));
                setLoading(false);
            }
        };

        if (e) e.preventDefault();
        setLoading(true);
        try {
            const isInstallMode = mode === 'install';
            const payload = isInstallMode
                ? {
                    branchId: versions.length === 0 ? manualBranch.trim() : formData.branch,
                    name: formData.name,
                    serverPort: Number(formData.gamePort),
                    rconPort: Number(formData.rconPort),
                    allowUnknownBranch: versions.length === 0,
                    force
                }
                : {
                    name: formData.name,
                    path: formData.path,
                    serviceName: formData.serviceName || undefined,
                    pzName: formData.pzName || undefined,
                    iniPath: formData.iniPath || undefined,
                    savePath: formData.savePath || undefined,
                    dbPath: formData.dbPath || undefined,
                    gamePort: Number(formData.gamePort) || 0,
                    rconPort: Number(formData.rconPort) || 0,
                    force
                };
            const res = await api.post(isInstallMode ? '/instances/from-version' : '/instances', payload);
            
            if (res.data.success) {
                if (isInstallMode && res.status === 202 && res.data.taskId) {
                    toast.success(res.data.message || ui.installQueued);
                    onInstallQueued?.(res.data.task || { id: res.data.taskId });
                    setLoading(false);
                    onClose();
                } else {
                    toast.success(t('instances.add'));
                    onInstanceAdded();
                    onClose();
                    setFormData({
                        name: '',
                        branch: '',
                        gamePort: '',
                        rconPort: '',
                        path: '',
                        serviceName: '',
                        pzName: '',
                        iniPath: '',
                        savePath: '',
                        dbPath: ''
                    });
                    setConflictData(null);
                    setLoading(false);
                }
            } else {
                toast.error(ui.errorGeneric);
                setLoading(false);
            }
        } catch (err) {
            handleConflict(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface border border-border w-full max-w-lg p-6 rounded-lg shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
                    <h2 className="text-xl font-bold text-text flex items-center">
                        <FaServer className="mr-2 text-primary" /> {taskId ? ui.titleProgress : ui.titleNew}
                    </h2>
                    <button onClick={onClose} className="text-muted hover:text-text transition-colors"><FaTimes /></button>
                </div>

                {taskId ? (
                    <div className="space-y-4">
                        <div className="w-full bg-surfaceAlt rounded-full h-4 overflow-hidden border border-border">
                            <div className="bg-primary h-4 transition-all duration-500 ease-in-out" style={{ width: `${taskProgress.progress || 0}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted">
                            <span>{getStatusLabel(taskProgress.status)}</span>
                            <span>{taskProgress.progress || 0}%</span>
                        </div>

                        {taskProgress?.metadata?.queuePosition > 1 && taskProgress.status === 'pending' && (
                            <p className="text-xs text-warning">
                                {ui.queueLabel} {taskProgress.metadata.queuePosition}
                            </p>
                        )}

                        {taskProgress.status === 'failed' && taskProgress.error && (
                            <div className="rounded-lg border border-danger bg-danger/10 p-4 text-sm text-danger space-y-2">
                                <p className="font-semibold">{ui.finalErrorTitle}</p>
                                <p className="break-words">{taskProgress.error}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-muted">
                                {ui.logsHidden}
                            </p>
                            {Array.isArray(taskProgress.logs) && taskProgress.logs.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowTaskLogs((prev) => !prev)}
                                    className="text-xs inline-flex items-center gap-2 px-3 py-2 rounded border border-border bg-background hover:border-primary transition-colors"
                                >
                                    {showTaskLogs ? ui.hideLogs : ui.showLogs}
                                </button>
                            )}
                        </div>

                        {showTaskLogs && (
                            <div className="bg-background border border-border rounded p-3 h-64 overflow-y-auto font-mono text-xs text-text flex flex-col space-y-1" id="install-logs">
                                {Array.isArray(taskProgress.logs) && taskProgress.logs.length > 0 ? taskProgress.logs.map((log, i) => (
                                    <span key={i} className={getLogTone(log)}>{log}</span>
                                )) : (
                                    <span className="text-muted">{ui.waitingLogs}</span>
                                )}
                            </div>
                        )}

                        {taskProgress.status === 'failed' && !showTaskLogs && Array.isArray(taskProgress.logs) && taskProgress.logs.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowTaskLogs(true)}
                                className="text-xs text-primary hover:underline text-left"
                            >
                                {ui.openFullLogs}
                            </button>
                        )}

                        <div className="flex justify-end">
                            <Button type="button" variant="surface" onClick={onClose}>{ui.close}</Button>
                        </div>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-2 bg-surfaceAlt p-1 rounded-md border border-border">
                        <button
                            type="button"
                            onClick={() => setMode('install')}
                            className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${mode === 'install' ? 'bg-primary text-white' : 'text-muted hover:text-text'}`}
                            disabled={loading}
                        >
                            {ui.installNew}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('import')}
                            className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${mode === 'import' ? 'bg-primary text-white' : 'text-muted hover:text-text'}`}
                            disabled={loading}
                        >
                            {ui.importExisting}
                        </button>
                    </div>

                    {mode === 'install' ? (
                    <>
                    <div>
                        <label className="block text-muted text-sm mb-1 font-medium">{ui.branchLabel}</label>
                        {fetchingVersions ? (
                            <select disabled className="w-full bg-background border border-border rounded p-2.5 text-text">
                                <option>{ui.fetchingBranches}</option>
                            </select>
                        ) : versions.length === 0 ? (
                            <div className="bg-surfaceAlt border border-warning rounded p-3 text-sm">
                                <p className="text-onSurface">{ui.noBranchesFound}</p>
                                {versionsError && (
                                    <p className="text-warning mt-1">{versionsError}</p>
                                )}
                                <div className="mt-3">
                                    <label className="block text-muted text-xs mb-1">{t('instances.manualBranchId')}</label>
                                    <input
                                        value={manualBranch}
                                        onChange={(e) => setManualBranch(e.target.value)}
                                        placeholder="public, unstable, b41multiplayer, build42..."
                                        className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="mt-3">
                                    <Button type="button" variant="surface" onClick={fetchVersions} disabled={loading || fetchingVersions}>
                                                        <FaSync className="mr-2" /> {ui.retry}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <select
                                required
                                disabled={loading}
                                className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                value={formData.branch}
                                onChange={e => setFormData({ ...formData, branch: e.target.value })}
                            >
                                {versions.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.label} {v.buildid ? `(Build: ${v.buildid})` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                                {versionsSource === 'fallback' && (
                            <p className="text-xs text-warning mt-2">
                                {ui.localBranches}
                            </p>
                        )}
                        {versionsSource === 'mixed' && (
                            <p className="text-xs text-warning mt-2">
                                {ui.mixedBranches}
                            </p>
                        )}
                        <p className="text-xs text-muted mt-1 opacity-80">{ui.installHelp}</p>
                    </div>
                    </>
                    ) : (
                    <>
                    <div>
                        <label className="block text-muted text-sm mb-1 font-medium">{ui.dirLabel}</label>
                        <input
                            required
                            disabled={loading}
                            className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                            placeholder="/opt/pzserver-miinstancia"
                            value={formData.path}
                            onChange={e => setFormData({ ...formData, path: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-muted text-sm mb-1 font-medium">{ui.serviceLabel}</label>
                            <input
                                disabled={loading}
                                className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                placeholder="pzomboid-miinstancia"
                                value={formData.serviceName}
                                onChange={e => setFormData({ ...formData, serviceName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-muted text-sm mb-1 font-medium">{ui.pzNameLabel}</label>
                            <input
                                disabled={loading}
                                className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                placeholder="pzmiinstancia"
                                value={formData.pzName}
                                onChange={e => setFormData({ ...formData, pzName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-muted text-sm mb-1 font-medium">{ui.iniLabel}</label>
                        <input
                            disabled={loading}
                            className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                            placeholder="/home/pzadmin/Zomboid/Server/pzmiinstancia.ini"
                            value={formData.iniPath}
                            onChange={e => setFormData({ ...formData, iniPath: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-muted text-sm mb-1 font-medium">{ui.saveLabel}</label>
                            <input
                                disabled={loading}
                                className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                placeholder="/home/pzadmin/Zomboid/Saves/Multiplayer/pzmiinstancia"
                                value={formData.savePath}
                                onChange={e => setFormData({ ...formData, savePath: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-muted text-sm mb-1 font-medium">{ui.dbLabel}</label>
                            <input
                                disabled={loading}
                                className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                placeholder="/home/pzadmin/Zomboid/db/pzmiinstancia.db"
                                value={formData.dbPath}
                                onChange={e => setFormData({ ...formData, dbPath: e.target.value })}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted -mt-2">{ui.ifNoPorts}</p>
                    </>
                    )}

                    <div>
                        <label className="block text-muted text-sm mb-1 font-medium">{t('instances.serverName')}</label>
                        <input
                            required
                            disabled={loading}
                            className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                            placeholder="Ej: MiServidorSurvival"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-muted text-sm mb-1 font-medium">{t('instances.gamePort')}</label>
                            <input
                                required
                                disabled={loading}
                                type="number"
                                className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                placeholder="16261"
                                value={formData.gamePort}
                                onChange={e => setFormData({ ...formData, gamePort: e.target.value })}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-muted text-sm mb-1 font-medium">{t('instances.rconPort')}</label>
                            <input
                                required
                                disabled={loading}
                                type="number"
                                className="w-full bg-background border border-border rounded p-2.5 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                placeholder="27015"
                                value={formData.rconPort}
                                onChange={e => setFormData({ ...formData, rconPort: e.target.value })}
                            />
                        </div>
                    </div>
                    
                    {loading && (
                        <div className="alert-warning flex items-center text-sm">
                            <FaSpinner className="animate-spin mr-3" />
                            <span>{ui.loadingInstall}</span>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button 
                            type="button"
                            variant="surface"
                            disabled={loading}
                            onClick={onClose}
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={
                                loading ||
                                (mode === 'install' && (fetchingVersions || (versions.length > 0 ? !formData.branch : !manualBranch.trim()))) ||
                                (mode === 'import' && !formData.path.trim())
                            }
                            className="flex items-center"
                        >
                            {loading
                                ? (mode === 'install' ? ui.installing : ui.creating)
                                : <><FaCheck className="mr-2" /> {mode === 'install' ? t('instances.createAndInstall') : ui.addInstance}</>
                            }
                        </Button>
                    </div>
                </form>
                )}
            </motion.div>

            {conflictData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-surface border border-warning w-full max-w-md p-6 rounded-lg shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-warning mb-4 flex items-center">
                            <FaExclamationTriangle className="mr-2" />
                            {ui.portConflictTitle}
                        </h3>
                        <div className="text-text space-y-2 mb-6">
                            <p>{ui.portConflictBody}</p>
                            <ul className="list-disc list-inside text-sm text-danger font-mono bg-background p-3 rounded">
                                {conflictData.conflicts.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                            <p className="text-muted text-sm mt-2">
                                {ui.portConflictWarning}
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <Button variant="surface" onClick={() => setConflictData(null)} disabled={loading}>
                                {t('cancel')}
                            </Button>
                            <Button variant="warning" onClick={() => handleSubmit(null, true)} disabled={loading}>
                                {loading ? ui.installing : ui.createAnyway}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AddInstanceModal;
