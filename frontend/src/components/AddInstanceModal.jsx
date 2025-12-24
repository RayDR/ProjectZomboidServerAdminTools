import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaFolder, FaServer, FaTerminal, FaCheck } from 'react-icons/fa';
import { Button } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const AddInstanceModal = ({ isOpen, onClose, onInstanceAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        pathDir: '',
        serviceName: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/instances', formData);
            if (res.data.success) {
                toast.success('Instance added successfully');
                onInstanceAdded();
                onClose();
                setFormData({ name: '', pathDir: '', serviceName: '' });
            } else {
                toast.error('Failed to add instance');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add instance');
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
                className="bg-zombie-gray-dark border border-zombie-green w-full max-w-lg p-6 rounded-lg shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <FaServer className="mr-2 text-zombie-green" /> Add New Instance
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Instance Name</label>
                        <input
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-zombie-green outline-none"
                            placeholder="My Zombie Server"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Installation Path (Absolute)</label>
                        <div className="flex items-center bg-gray-900 border border-gray-700 rounded p-2">
                            <FaFolder className="text-gray-500 mr-2" />
                            <input
                                required
                                className="w-full bg-transparent text-white outline-none"
                                placeholder="/opt/pzserver-custom"
                                value={formData.pathDir}
                                onChange={e => setFormData({ ...formData, pathDir: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Directory where ProjectZomboid is installed.</p>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Systemd Service Name</label>
                        <div className="flex items-center bg-gray-900 border border-gray-700 rounded p-2">
                            <FaTerminal className="text-gray-500 mr-2" />
                            <input
                                required
                                className="w-full bg-transparent text-white outline-none"
                                placeholder="pzomboid-custom"
                                value={formData.serviceName}
                                onChange={e => setFormData({ ...formData, serviceName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={loading} className="flex items-center">
                            {loading ? 'Adding...' : <><FaCheck className="mr-2" /> Add Instance</>}
                        </Button>
                    </div>
                </form>

            </motion.div>
        </div>
    );
};

export default AddInstanceModal;
