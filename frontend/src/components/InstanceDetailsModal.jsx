import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTerminal, FaFileAlt, FaCog, FaPuzzlePiece, FaServer, FaPlay, FaStop, FaRedo, FaSkull, FaSave } from 'react-icons/fa';
import { Button, Card, Badge } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const InstanceDetailsModal = ({ isOpen, onClose, instance, onAction }) => {
    const [activeTab, setActiveTab] = useState('controls');
    const [logs, setLogs] = useState('');
    const [iniContent, setIniContent] = useState('');
    const [iniPath, setIniPath] = useState('');
    const [rconCommand, setRconCommand] = useState('');
    const [rconOutput, setRconOutput] = useState([]);
    const [consoleLoading, setConsoleLoading] = useState(false);
    const [mods, setMods] = useState([]);

    useEffect(() => {
        if (isOpen && activeTab === 'logs') fetchLogs();
        if (isOpen && activeTab === 'config') fetchIni();
        // if (isOpen && activeTab === 'mods') fetchMods(); 
    }, [isOpen, activeTab, instance.id]);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/logs', { params: { instanceId: instance.id, type: 'main', lines: 100 } });
            setLogs(res.data.data.content);
        } catch (err) {
            toast.error('Failed to fetch logs');
        }
    };

    const fetchIni = async () => {
        try {
            const res = await api.get('/config/ini', { params: { instanceId: instance.id } });
            setIniContent(res.data.data.content);
            setIniPath(res.data.data.path);
        } catch (err) {
            toast.error('Failed to fetch INI');
        }
    };

    const handleSaveIni = async () => {
        try {
            await api.put('/config/ini', { instanceId: instance.id, content: iniContent });
            toast.success('INI Saved');
        } catch (err) {
            toast.error('Failed to save INI');
        }
    };

    const handleRconSubmit = async (e) => {
        e.preventDefault();
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zombie-gray-dark border border-zombie-green w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-zombie-green bg-zombie-black">
                    <div className="flex items-center space-x-3">
                        <FaServer className="text-zombie-green text-xl" />
                        <div>
                            <h2 className="text-xl font-bold text-white">{instance.name}</h2>
                            <p className="text-xs text-gray-400 font-mono">{instance.id} | {instance.gamePort}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FaTimes className="text-2xl" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-zombie-black bg-opacity-50 border-b border-gray-700">
                    {['controls', 'logs', 'config', 'console', 'mods'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors
                   ${activeTab === tab ? 'bg-zombie-green text-zombie-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
                `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-zombie-gray-dark">
                    {activeTab === 'controls' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <h3 className="text-lg font-bold text-white mb-4">Instance Status</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">State:</span>
                                        <Badge variant={instance.running ? 'success' : 'error'}>{instance.running ? 'RUNNING' : 'STOPPED'}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">PID:</span>
                                        <span className="font-mono text-white">{instance.pid || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Last Shutdown Reason:</span>
                                        <span className="text-red-400">{instance.shutdownReason || '-'}</span>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <h3 className="text-lg font-bold text-white mb-4">Power Controls</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="primary"
                                        disabled={instance.running}
                                        onClick={(e) => onAction(e, instance.id, 'start')}
                                        className="flex items-center justify-center py-4"
                                    >
                                        <FaPlay className="mr-2" /> Start
                                    </Button>
                                    <Button
                                        variant="danger"
                                        disabled={!instance.running}
                                        onClick={(e) => onAction(e, instance.id, 'stop')}
                                        className="flex items-center justify-center py-4"
                                    >
                                        <FaStop className="mr-2" /> Stop
                                    </Button>
                                    <Button
                                        variant="warning"
                                        disabled={!instance.running}
                                        onClick={(e) => onAction(e, instance.id, 'restart')}
                                        className="flex items-center justify-center py-4"
                                    >
                                        <FaRedo className="mr-2" /> Reboot
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={(e) => onAction(e, instance.id, 'kill')}
                                        className="flex items-center justify-center py-4 border-2 border-red-600 animate-pulse bg-red-900"
                                    >
                                        <FaSkull className="mr-2" /> FORCE KILL
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-black text-green-500 font-mono text-xs p-4 rounded h-full overflow-auto whitespace-pre-wrap shadow-inner border border-gray-700">
                            {logs || 'Loading logs or log is empty...'}
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500 font-mono">{iniPath}</span>
                                <Button size="sm" onClick={handleSaveIni}><FaSave className="mr-1" /> Save Changes</Button>
                            </div>
                            <textarea
                                className="flex-1 bg-gray-900 text-gray-300 font-mono text-sm p-4 rounded border border-gray-700 focus:border-zombie-green outline-none resize-none"
                                value={iniContent}
                                onChange={(e) => setIniContent(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === 'console' && (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 bg-black text-gray-300 font-mono text-sm p-4 rounded mb-4 overflow-auto border border-gray-700">
                                {rconOutput.map((line, i) => (
                                    <div key={i} className={`${line.type === 'input' ? 'text-yellow-500' : line.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                                        {line.text}
                                    </div>
                                ))}
                                {rconOutput.length === 0 && <span className="text-gray-600 opacity-50">RCON Console Ready. Type 'help' for commands.</span>}
                            </div>
                            <form onSubmit={handleRconSubmit} className="flex gap-2">
                                <input
                                    className="flex-1 bg-gray-800 text-white font-mono px-4 py-2 rounded border border-gray-600 focus:border-zombie-green outline-none"
                                    placeholder="Enter RCON command..."
                                    value={rconCommand}
                                    onChange={(e) => setRconCommand(e.target.value)}
                                    disabled={consoleLoading}
                                />
                                <Button type="submit" disabled={consoleLoading}>Send</Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'mods' && (
                        <div className="text-center text-gray-500 pt-10">
                            <FaPuzzlePiece className="text-4xl mx-auto mb-2 opacity-50" />
                            <p>Mod management coming soon.</p>
                            <p className="text-xs">Check INI tab to edit WorkshopItems manually.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default InstanceDetailsModal;
