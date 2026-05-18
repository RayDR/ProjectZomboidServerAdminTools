import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaServer, FaCheck, FaSpinner, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { Button } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n/index.jsx';

const AddInstanceModal = ({ isOpen, onClose, onInstanceAdded }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        branch: '',
        gamePort: '',
        rconPort: ''
    });
    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState([]);
    const [versionsSource, setVersionsSource] = useState(null);
    const [versionsError, setVersionsError] = useState('');
    const [manualBranch, setManualBranch] = useState('');
    const [fetchingVersions, setFetchingVersions] = useState(false);
    const [conflictData, setConflictData] = useState(null);

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
                    setVersionsError('No versions are available. SteamCMD may be unavailable and the local fallback list is empty.');
                }
            } else {
                setVersions([]);
                setFormData(prev => ({ ...prev, branch: '' }));
                setVersionsError('Could not load branch list.');
            }
        } catch (error) {
            setVersions([]);
            setFormData(prev => ({ ...prev, branch: '' }));
            setVersionsError(error.response?.data?.message || 'Could not load branch list from backend.');
            toast.error('Error al obtener ramas de Project Zomboid');
        } finally {
            setFetchingVersions(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            void fetchVersions();
        }
    }, [isOpen]);

    const handleSubmit = async (e, force = false) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                branchId: versions.length === 0 ? manualBranch.trim() : formData.branch,
                name: formData.name,
                serverPort: Number(formData.gamePort),
                rconPort: Number(formData.rconPort),
                allowUnknownBranch: versions.length === 0,
                force
            };
            const res = await api.post('/instances/from-version', payload);
            
            if (res.data.success) {
                toast.success(t('instances.add'));
                onInstanceAdded();
                onClose();
                setFormData({ name: '', branch: '', gamePort: '', rconPort: '' });
                setConflictData(null);
            } else {
                toast.error(t('error'));
            }
        } catch (err) {
            if (err.response?.data?.code === 'PORT_CONFLICT') {
                setConflictData({ conflicts: err.response.data.conflicts || [] });
            } else {
                toast.error(err.response?.data?.error || err.response?.data?.message || t('error'));
            }
        } finally {
            setLoading(false);
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
                        <FaServer className="mr-2 text-primary" /> Nueva Instancia (SteamCMD)
                    </h2>
                    <button onClick={onClose} className="text-muted hover:text-text transition-colors"><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-muted text-sm mb-1 font-medium">Rama / Build (SteamCMD)</label>
                        {fetchingVersions ? (
                            <select disabled className="w-full bg-background border border-border rounded p-2.5 text-text">
                                <option>Consultando SteamCMD...</option>
                            </select>
                        ) : versions.length === 0 ? (
                            <div className="bg-surfaceAlt border border-warning rounded p-3 text-sm">
                                <p className="text-onSurface">No se encontraron ramas.</p>
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
                                        <FaSync className="mr-2" /> Reintentar
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
                                Using local branch list because SteamCMD branches could not be detected.
                            </p>
                        )}
                        {versionsSource === 'mixed' && (
                            <p className="text-xs text-warning mt-2">
                                Showing SteamCMD branches plus local fallback entries.
                            </p>
                        )}
                        <p className="text-xs text-muted mt-1 opacity-80">Se descargará e instalará usando SteamCMD.</p>
                    </div>
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
                            <span>Descargando e instalando Project Zomboid... Esto puede tardar varios minutos dependiendo de tu conexión.</span>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button 
                            type="button"
                            variant="surface"
                            disabled={loading}
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={loading || fetchingVersions || (versions.length > 0 ? !formData.branch : !manualBranch.trim())}
                            className="flex items-center"
                        >
                            {loading ? t('instances.installing') : <><FaCheck className="mr-2" /> {t('instances.createAndInstall')}</>}
                        </Button>
                    </div>
                </form>

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
                            Conflicto de Puertos
                        </h3>
                        <div className="text-text space-y-2 mb-6">
                            <p>Los puertos seleccionados ya están en uso:</p>
                            <ul className="list-disc list-inside text-sm text-danger font-mono bg-background p-3 rounded">
                                {conflictData.conflicts.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                            <p className="text-muted text-sm mt-2">
                                ¿Deseas crear la instancia de todos modos? Esto podría causar que el servidor no inicie correctamente si ambos servidores se ejecutan a la vez.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <Button variant="surface" onClick={() => setConflictData(null)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button variant="warning" onClick={() => handleSubmit(null, true)} disabled={loading}>
                                {loading ? 'Instalando...' : 'Crear de todos modos'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AddInstanceModal;
