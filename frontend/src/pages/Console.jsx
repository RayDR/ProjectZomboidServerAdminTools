import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaTerminal, FaArrowUp, FaPaperPlane, FaTrash, FaHistory } from 'react-icons/fa';
import { Card, Button } from '../components/ui';
import { GlitchText, CRTScreen } from '../components/effects/ZombieEffects';
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const Console = () => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [executing, setExecuting] = useState(false);
  const outputEndRef = useRef(null);
  const inputRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    scrollToBottom();
  }, [output]);

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('rconHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const executeCommand = async (e) => {
    e?.preventDefault();
    
    if (!command.trim()) return;

    const cmd = command.trim();
    
    // Add to output
    addOutput(`> ${cmd}`, 'command');
    
    // Add to history
    const newHistory = [cmd, ...history.filter(h => h !== cmd)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('rconHistory', JSON.stringify(newHistory));
    setHistoryIndex(-1);
    
    setCommand('');
    setExecuting(true);

    try {
      const response = await api.post('/commands', {
        action: 'rcon',
        command: cmd
      });
      
      if (response.data.success) {
        addOutput(response.data.output || response.data.message, 'success');
      } else {
        addOutput(response.data.error || 'Command failed', 'error');
      }
    } catch (error) {
      addOutput(error.response?.data?.error || error.message, 'error');
    } finally {
      setExecuting(false);
      inputRef.current?.focus();
    }
  };

  const addOutput = (text, type = 'info') => {
    setOutput(prev => [...prev, {
      id: Date.now(),
      text,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearConsole = () => {
    setOutput([]);
    toast.success('Console cleared');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const quickCommands = [
    { label: 'Players', cmd: 'players' },
    { label: 'Save', cmd: 'save' },
    { label: 'Server Info', cmd: 'servermsg "Server Info"' },
    { label: 'Quit', cmd: 'quit' },
  ];

  const getOutputColor = (type) => {
    switch (type) {
      case 'command':
        return 'text-zombie-green font-bold';
      case 'error':
        return 'text-zombie-blood';
      case 'success':
        return 'text-terminal-text';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-terminal-text text-shadow-terminal font-zombie mb-2">
            <GlitchText>{t('console.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green text-sm sm:text-base">
            {t('console.subtitle')}
          </p>
        </div>
      </div>

      {/* Quick Commands */}
      <Card>
        <h3 className="text-sm font-bold text-zombie-green mb-3 uppercase tracking-wide">
          Quick Commands
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickCommands.map((qc) => (
            <Button
              key={qc.cmd}
              variant="secondary"
              onClick={() => {
                setCommand(qc.cmd);
                inputRef.current?.focus();
              }}
              className="text-xs sm:text-sm"
            >
              {qc.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Console Output */}
      <CRTScreen className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FaTerminal className="text-zombie-green text-xl" />
            <h2 className="text-xl font-bold text-zombie-green font-mono">
              RCON TERMINAL
            </h2>
          </div>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded text-xs font-bold ${executing ? 'bg-zombie-warning text-black' : 'bg-zombie-success text-white'}`}>
              {executing ? '⏳ Executing' : '✓ Ready'}
            </span>
            <Button
              variant="danger"
              onClick={clearConsole}
              className="text-xs"
            >
              <FaTrash className="mr-1" /> {t('console.clear')}
            </Button>
          </div>
        </div>
        
        {/* Output Area */}
        <div 
          className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm mb-4 border-2 border-zombie-green"
          style={{
            fontFamily: 'monospace',
            background: 'linear-gradient(to bottom, #000000, #001a00)',
            boxShadow: 'inset 0 0 20px rgba(0, 255, 0, 0.1)'
          }}
        >
          {output.length === 0 ? (
            <div className="text-zombie-green opacity-50">
              <p>╔═══════════════════════════════════════════════╗</p>
              <p>║  PROJECT ZOMBOID - RCON CONSOLE              ║</p>
              <p>║  Type commands below and press Enter         ║</p>
              <p>║  Use ↑/↓ arrows for command history         ║</p>
              <p>╚═══════════════════════════════════════════════╝</p>
              <br/>
              <p className="animate-pulse">$ Waiting for input...</p>
            </div>
          ) : (
            output.map((line) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`py-1 ${getOutputColor(line.type)} whitespace-pre-wrap break-words`}
              >
                <span className="text-gray-600 text-xs mr-2">[{line.timestamp}]</span>
                {line.text}
              </motion.div>
            ))
          )}
          <div ref={outputEndRef} />
        </div>

        {/* Command Input */}
        <form onSubmit={executeCommand} className="flex space-x-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zombie-green font-mono font-bold">
              $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('console.commandPlaceholder')}
              disabled={executing}
              className="input pl-8 font-mono bg-black bg-opacity-50 border-zombie-green text-terminal-text w-full"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={executing || !command.trim()}
          >
            <FaPaperPlane className="mr-2" />
            {t('console.send')}
          </Button>
        </form>

        {/* History indicator */}
        {history.length > 0 && (
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
            <span className="flex items-center">
              <FaHistory className="mr-1" />
              {history.length} commands in history (↑/↓ to navigate)
            </span>
            {historyIndex >= 0 && (
              <span className="badge badge-secondary text-xs">
                History {historyIndex + 1}/{history.length}
              </span>
            )}
          </div>
        )}
      </CRTScreen>

      {/* Common Commands Help */}
      <Card className="bg-zombie-gray-dark border-zombie-green">
        <h3 className="text-lg font-bold text-zombie-green mb-3 flex items-center">
          <FaTerminal className="mr-2" />
          Common RCON Commands
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <code className="text-zombie-green">players</code>
              <span className="text-gray-400">List online players</span>
            </div>
            <div className="flex justify-between">
              <code className="text-zombie-green">save</code>
              <span className="text-gray-400">Save the world</span>
            </div>
            <div className="flex justify-between">
              <code className="text-zombie-green">quit</code>
              <span className="text-gray-400">Stop the server</span>
            </div>
            <div className="flex justify-between">
              <code className="text-zombie-green">servermsg "text"</code>
              <span className="text-gray-400">Broadcast message</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <code className="text-zombie-green">adduser "user" "pwd"</code>
              <span className="text-gray-400">Add user</span>
            </div>
            <div className="flex justify-between">
              <code className="text-zombie-green">kickuser "user"</code>
              <span className="text-gray-400">Kick player</span>
            </div>
            <div className="flex justify-between">
              <code className="text-zombie-green">banuser "user"</code>
              <span className="text-gray-400">Ban player</span>
            </div>
            <div className="flex justify-between">
              <code className="text-zombie-green">chopper</code>
              <span className="text-gray-400">Trigger helicopter</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Console;
