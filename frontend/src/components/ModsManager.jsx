import React, { useState, useEffect } from 'react';
import { FaPuzzlePiece, FaPlus, FaTrash, FaUpload, FaDownload } from 'react-icons/fa';
import { Button, Card, Badge } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n/index.jsx';

const ModsManager = ({ instanceId }) => {
    const { t } = useTranslation();
    const [mods, setMods] = useState([]);
    const [workshopItems, setWorkshopItems] = useState([]);
    const [availableMods, setAvailableMods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addModId, setAddModId] = useState('');
    const [addWorkshopId, setAddWorkshopId] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchMods();
    }, [instanceId]);

    const fetchMods = async () => {
        try {
            const res = await api.get(`/instances/${instanceId}/mods`);
            setMods(res.data.data.mods || []);
            setWorkshopItems(res.data.data.workshopItems || []);
            setAvailableMods(res.data.data.availableMods || []);
        } catch (err) {
            toast.error('Failed to load mods');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMod = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/instances/${instanceId}/mods`, { modId: addModId, workshopId: addWorkshopId });
            toast.success('Mod added successfully');
            setAddModId('');
            setAddWorkshopId('');
            fetchMods();
        } catch (err) {
            toast.error('Failed to add mod');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/instances/${instanceId}/mods/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Mod uploaded successfully');
        } catch (err) {
            toast.error('Failed to upload mod');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveMod = async (modId, isWorkshop = false) => {
        if (!confirm(`Are you sure you want to remove ${isWorkshop ? 'Workshop Item' : 'Mod'}: ${modId}?`)) return;

        try {
            let apiUrl = `/instances/${instanceId}/mods`;
            if (isWorkshop) {
                apiUrl += `/workshop_item?workshopId=${modId}`;
            } else {
                apiUrl += `/${modId}`;
            }

            await api.delete(apiUrl);
            toast.success(`${isWorkshop ? 'Workshop Item' : 'Mod'} removed`);
            fetchMods();
        } catch (err) {
            toast.error('Failed to remove item');
        }
    };

    if (loading) return <div className="text-gray-500 text-center p-4">Loading mods...</div>;

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Add Mod Form */}
            <Card className="bg-background">
                <h3 className="text-lg font-bold text-text mb-2 flex items-center">
                    <FaPlus className="mr-2 text-primary" /> Add Mod
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form onSubmit={handleAddMod} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:border-primary outline-none"
                                placeholder="Mod ID (e.g. Brita)"
                                value={addModId}
                                onChange={e => setAddModId(e.target.value)}
                            />
                            <input
                                className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:border-primary outline-none"
                                placeholder="Workshop ID (e.g. 240205)"
                                value={addWorkshopId}
                                onChange={e => setAddWorkshopId(e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="sm" disabled={!addModId && !addWorkshopId}>
                            Add to INI
                        </Button>
                    </form>

                    <div className="border-l border-border pl-4">
                        <h4 className="text-xs text-muted mb-2 uppercase font-bold">Upload Mod File (zip/folder)</h4>
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer bg-surface border border-border hover:border-primary text-text px-3 py-2 rounded text-sm flex items-center transition-colors">
                                <FaUpload className="mr-2" />
                                {uploading ? 'Uploading...' : 'Choose File'}
                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                            <span className="text-xs text-muted">Uploads to Zomboid/mods</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Lists */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                <div className="flex flex-col border border-border rounded bg-surfaceAlt relative group/container">
                    <h3 className="text-text font-bold mb-2 sticky top-0 bg-background z-10 p-2 border-b border-border">
                        Enabled Mods ({mods.length})
                    </h3>
                    <div className="flex-1 overflow-auto p-2 space-y-1 resize-y min-h-[200px]">
                        {mods.map((mod, i) => (
                            <div key={i} className="text-sm text-success bg-surface p-2 rounded border border-border flex justify-between items-center group mb-1">
                                <span className="truncate flex-1" title={mod}>{mod}</span>
                                <button
                                    onClick={() => handleRemoveMod(mod, false)}
                                    className="ml-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove Mod"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                        {mods.length === 0 && <p className="text-muted text-xs italic">No mods enabled in INI</p>}
                    </div>
                </div>

                <div className="flex flex-col border border-border rounded bg-surfaceAlt">
                    <h3 className="text-text font-bold mb-2 sticky top-0 bg-background z-10 p-2 border-b border-border">
                        Available on Disk ({availableMods.length})
                    </h3>
                    <div className="flex-1 overflow-auto p-2 space-y-1 resize-y min-h-[200px]">
                        {availableMods.map((mod, i) => (
                            <div key={i} className="text-sm text-text bg-surface p-2 rounded border border-border flex justify-between items-center group mb-1">
                                <span className="truncate w-full" title={mod}>{mod}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setAddModId(mod)}
                                        className="text-xs bg-primary text-background px-2 py-1 rounded shrink-0 font-bold"
                                        title="Use this ID"
                                    >
                                        Select
                                    </button>
                                    <button
                                        onClick={() => handleRemoveMod(mod, false)}
                                        className="text-muted hover:text-danger px-1"
                                        title="Delete from Disk (and INI)"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {availableMods.length === 0 && <p className="text-muted text-xs italic">No mods found in ~/Zomboid/mods</p>}
                    </div>
                </div>

                <div className="flex flex-col border border-border rounded bg-surfaceAlt">
                    <h3 className="text-text font-bold mb-2 sticky top-0 bg-background z-10 p-2 border-b border-border">
                        Workshop Items ({workshopItems.length})
                    </h3>
                    <div className="flex-1 overflow-auto p-2 space-y-1 resize-y min-h-[200px]">
                        {workshopItems.map((item, i) => (
                            <div key={i} className="text-sm text-info bg-surface p-2 rounded border border-border flex justify-between items-center group mb-1">
                                <span className="truncate flex-1">{item}</span>
                                <div className="flex items-center gap-2">
                                    <a href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${item}`} target="_blank" rel="noreferrer" className="text-xs text-muted hover:text-text shrink-0 transition-colors">
                                        <FaDownload />
                                    </a>
                                    <button
                                        onClick={() => handleRemoveMod(item, true)}
                                        className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Workshop Item"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {workshopItems.length === 0 && <p className="text-muted text-xs italic">No Workshop IDs in INI</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModsManager;
