import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFileAlt, FaSearch, FaDownload, FaTrash, FaScroll, FaArrowDown, FaSpinner } from 'react-icons/fa';
import { Card, Button, Badge, Input } from '../components/ui';
import { GlitchText } from '../components/effects/ZombieEffects';
import { useTranslation } from '../i18n/index.jsx';
import api from '../services/api';
import toast from 'react-hot-toast';

const Logs = () => {
  const [activeTab, setActiveTab] = useState('server');
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'error', 'warning', 'success'
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentLines, setCurrentLines] = useState(200);
  const [olderLinesLoaded, setOlderLinesLoaded] = useState(200);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastLogHash, setLastLogHash] = useState('');
  const [logStats, setLogStats] = useState({ totalLines: 0, fileSize: 0, fileSizeFormatted: '0 B' });
  const [allLogCounts, setAllLogCounts] = useState({ errors: 0, warnings: 0, success: 0, info: 0 });
  const [viewerHeight, setViewerHeight] = useState(384); // 96 * 4 = 384px (h-96)
  const [isResizing, setIsResizing] = useState(false);
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);
  const logsCache = useRef(new Map());
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);
  const { t } = useTranslation();

  // Initial load - get recent logs and scroll to bottom
  useEffect(() => {
    fetchLogs(true);
    fetchLogStats();
  }, [activeTab]);

  // Auto-refresh only new logs
  useEffect(() => {
    if (isUserScrolling) return; // Don't refresh while user is reading
    
    const interval = setInterval(() => {
      fetchNewLogs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab, isUserScrolling, lastLogHash]);

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && !isUserScrolling) {
      scrollToBottom('auto');
    }
  }, [logs, autoScroll, isUserScrolling]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterType]);

  const createLogHash = (content) => {
    return content.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0).toString(36);
  };

  const parseLogLines = (content, startIndex = 0) => {
    return content
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => {
        const hash = createLogHash(line);
        return {
          id: `${hash}-${startIndex + index}`,
          content: line,
          type: detectLogType(line),
          timestamp: extractTimestamp(line),
          originalIndex: startIndex + index,
          hash
        };
      });
  };

  const scrollToBottom = (behavior = 'smooth') => {
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior });
    }, 100);
  };

  const handleScrollToBottom = () => {
    setAutoScroll(true);
    setIsUserScrolling(false);
    scrollToBottom('smooth');
  };

  // Fetch initial logs (most recent)
  const fetchLogs = async (scrollToEnd = false) => {
    const cacheKey = `${activeTab}-${currentLines}`;
    
    // Check cache first
    if (logsCache.current.has(cacheKey) && !scrollToEnd) {
      const cached = logsCache.current.get(cacheKey);
      setLogs(cached.logs);
      setLastLogHash(cached.hash);
      return;
    }

    try {
      setLoading(true);
      const endpoint = activeTab === 'server' ? '/logs/server' : '/logs/maintenance';
      const response = await api.get(endpoint, {
        params: { lines: currentLines }
      });
      
      if (response.data.success) {
        const content = response.data.data.content;
        const parsedLogs = parseLogLines(content);
        
        // Remove exact duplicates
        const uniqueLogs = parsedLogs.filter((log, index, self) => 
          index === self.findIndex(l => l.hash === log.hash)
        );
        
        // Calculate total counts for all logs
        const counts = {
          errors: uniqueLogs.filter(l => l.type === 'error').length,
          warnings: uniqueLogs.filter(l => l.type === 'warning').length,
          success: uniqueLogs.filter(l => l.type === 'success').length,
          info: uniqueLogs.filter(l => l.type === 'info').length
        };
        setAllLogCounts(counts);
        
        setLogs(uniqueLogs);
        
        // Cache the result
        const contentHash = createLogHash(content);
        setLastLogHash(contentHash);
        logsCache.current.set(cacheKey, { logs: uniqueLogs, hash: contentHash });
        
        // Scroll to bottom on initial load
        if (scrollToEnd) {
          setTimeout(() => scrollToBottom('auto'), 200);
        }
      }
    } catch (error) {
      toast.error(t('error') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch only new logs (incremental update)
  const fetchNewLogs = async () => {
    try {
      const endpoint = activeTab === 'server' ? '/logs/server' : '/logs/maintenance';
      const response = await api.get(endpoint, {
        params: { lines: 50 } // Only get last 50 lines
      });
      
      if (response.data.success) {
        const content = response.data.data.content;
        const contentHash = createLogHash(content);
        
        // Only update if content changed
        if (contentHash !== lastLogHash) {
          const newParsedLogs = parseLogLines(content, logs.length);
          
          // Merge with existing logs, avoiding duplicates
          setLogs(prevLogs => {
            const existingHashes = new Set(prevLogs.map(l => l.hash));
            const trulyNewLogs = newParsedLogs.filter(l => !existingHashes.has(l.hash));
            
            if (trulyNewLogs.length > 0) {
              return [...prevLogs, ...trulyNewLogs];
            }
            return prevLogs;
          });
          
          setLastLogHash(contentHash);
        }
      }
    } catch (error) {
      // Silently fail for background updates
      console.error('Failed to fetch new logs:', error);
    }
  };

  const loadMoreLogs = useCallback(async () => {
    if (loadingMore || olderLinesLoaded >= 2000) return; // Max 2000 lines
    
    setLoadingMore(true);
    const newTotal = olderLinesLoaded + 300;
    
    try {
      const container = logsContainerRef.current;
      const prevScrollHeight = container?.scrollHeight || 0;
      
      const endpoint = activeTab === 'server' ? '/logs/server' : '/logs/maintenance';
      const response = await api.get(endpoint, {
        params: { lines: newTotal }
      });
      
      if (response.data.success) {
        const content = response.data.data.content;
        const parsedLogs = parseLogLines(content);
        
        // Remove duplicates
        const uniqueLogs = parsedLogs.filter((log, index, self) => 
          index === self.findIndex(l => l.hash === log.hash)
        );
        
        // Calculate total counts
        const counts = {
          errors: uniqueLogs.filter(l => l.type === 'error').length,
          warnings: uniqueLogs.filter(l => l.type === 'warning').length,
          success: uniqueLogs.filter(l => l.type === 'success').length,
          info: uniqueLogs.filter(l => l.type === 'info').length
        };
        setAllLogCounts(counts);
        
        setLogs(uniqueLogs);
        setOlderLinesLoaded(newTotal);
        
        // Restore scroll position
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      toast.error(t('logs.errorLoadingOld'));
    } finally {
      setTimeout(() => setLoadingMore(false), 500);
    }
  }, [loadingMore, olderLinesLoaded, activeTab]);

  // Handle scroll detection
  useEffect(() => {
    const container = logsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Show scroll-to-bottom button if not at bottom
      setShowScrollButton(distanceFromBottom > 100);
      
      // Disable auto-scroll if user scrolls up
      if (distanceFromBottom > 100) {
        setAutoScroll(false);
        setIsUserScrolling(true);
      }
      
      // Load more logs when scrolling near top
      if (scrollTop < 50 && !loadingMore && olderLinesLoaded < 2000) {
        loadMoreLogs();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadingMore, olderLinesLoaded, loadMoreLogs]);

  const detectLogType = (line) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('exception') || lowerLine.includes('failed')) {
      return 'error';
    }
    if (lowerLine.includes('warn')) {
      return 'warning';
    }
    if (lowerLine.includes('success') || lowerLine.includes('completed')) {
      return 'success';
    }
    return 'info';
  };

  const extractTimestamp = (line) => {
    // Try to extract timestamp from common formats
    // Project Zomboid format: [DD-MM-YY HH:MM:SS.mmm]
    const pzMatch = line.match(/^\[(\d{2})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2})/);
    if (pzMatch) {
      const [_, dd, mm, yy, time] = pzMatch;
      return `${dd}/${mm}/20${yy} ${time}`;
    }
    
    // Generic format: [timestamp]
    const genericMatch = line.match(/^\[([\d\-:.\s]+)\]/);
    return genericMatch ? genericMatch[1] : null;
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      // Parse timestamp
      const parts = timestamp.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
      if (!parts) return timestamp;
      
      const [_, day, month, year, time] = parts;
      const logDate = new Date(`${year}-${month}-${day}T${time}`);
      const now = new Date();
      const diff = now - logDate;
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      if (seconds > 10) return `${seconds}s ago`;
      return 'just now';
    } catch (e) {
      return timestamp;
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const fetchLogStats = async () => {
    try {
      const type = activeTab === 'server' ? 'main' : 'maintenance';
      const response = await api.get('/logs/stats', { params: { type } });
      if (response.data.success) {
        setLogStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch log stats:', error);
    }
  };

  const clearLogs = async () => {
    const confirmMessage = 'Esto creará un backup del log actual y limpiará el archivo. ¿Continuar?';
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const type = activeTab === 'server' ? 'main' : 'maintenance';
      const response = await api.post('/logs/clear', { type });
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Clear local cache and state
        setLogs([]);
        setFilteredLogs([]);
        logsCache.current.clear();
        setOlderLinesLoaded(200);
        setCurrentLines(200);
        // Refresh stats
        fetchLogStats();
      } else {
        toast.error(response.data.message || 'Failed to clear log');
      }
    } catch (error) {
      toast.error('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const content = filteredLogs.map(log => log.content).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Logs exported');
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-zombie-blood';
      case 'warning':
        return 'text-zombie-warning';
      case 'success':
        return 'text-zombie-green';
      default:
        return 'text-gray-300';
    }
  };

  // Resize handlers
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = viewerHeight;
  };

  const handleResizeMove = useCallback((e) => {
    const delta = e.clientY - resizeStartY.current;
    const newHeight = Math.max(350, Math.min(3500, resizeStartHeight.current + delta));
    setViewerHeight(newHeight);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-terminal-text text-shadow-terminal font-zombie mb-2">
            <GlitchText>{t('logs.title')}</GlitchText>
          </h1>
          <p className="text-zombie-green text-sm sm:text-base">
            {t('logs.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto">
        <Button
          variant={activeTab === 'server' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('server')}
        >
          📄 {t('logs.serverLog')}
        </Button>
        <Button
          variant={activeTab === 'maintenance' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('maintenance')}
        >
          🔧 {t('logs.maintenanceLog')}
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <FaSearch className="text-zombie-green text-xl flex-shrink-0" />
            <Input
              type="text"
              placeholder={t('logs.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={exportLogs}
              className="text-xs sm:text-sm"
            >
              <FaDownload className="sm:mr-1" />
              <span className="hidden sm:inline">{t('export')}</span>
            </Button>
            <Button
              variant="error"
              onClick={clearLogs}
              className="text-xs sm:text-sm"
              disabled={loading}
            >
              <FaTrash className="sm:mr-2" />
              <span className="hidden sm:inline">{t('logs.clearLog')}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card 
          className={`bg-zombie-gray-dark border-2 cursor-pointer transition-all ${filterType === 'all' ? 'border-zombie-green shadow-lg shadow-zombie-green/20' : 'border-gray-600 hover:border-zombie-green'}`}
          onClick={() => setFilterType('all')}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-terminal-text">{filteredLogs.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
              {filterType === 'all' ? '✓ ' : ''}{t('logs.showing')}
            </div>
            <div className="text-xs text-zombie-green mt-1">
              Total: {logStats.totalLines.toLocaleString()}
            </div>
          </div>
        </Card>
        
        <Card 
          className={`bg-zombie-gray-dark border-2 cursor-pointer transition-all ${filterType === 'error' ? 'border-zombie-blood shadow-lg shadow-zombie-blood/20' : 'border-gray-600 hover:border-zombie-blood'}`}
          onClick={() => setFilterType(filterType === 'error' ? 'all' : 'error')}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-zombie-blood">
              {allLogCounts.errors}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
              {filterType === 'error' ? '✓ ' : ''}{t('logs.errors')}
            </div>
            {filterType === 'error' && (
              <div className="text-xs text-zombie-yellow mt-1">
                {t('logs.showing')}: {filteredLogs.length}
              </div>
            )}
          </div>
        </Card>
        
        <Card 
          className={`bg-zombie-gray-dark border-2 cursor-pointer transition-all ${filterType === 'warning' ? 'border-zombie-warning shadow-lg shadow-zombie-warning/20' : 'border-gray-600 hover:border-zombie-warning'}`}
          onClick={() => setFilterType(filterType === 'warning' ? 'all' : 'warning')}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-zombie-warning">
              {allLogCounts.warnings}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
              {filterType === 'warning' ? '✓ ' : ''}{t('logs.warnings')}
            </div>
            {filterType === 'warning' && (
              <div className="text-xs text-zombie-green mt-1">
                {t('logs.showing')}: {filteredLogs.length}
              </div>
            )}
          </div>
        </Card>
        
        <Card className="bg-zombie-gray-dark border-2 border-gray-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-zombie-green">
              {logStats.fileSizeFormatted}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
              {t('logs.size')}
            </div>
          </div>
        </Card>
      </div>

      {/* Logs Display */}
      <Card className="bg-black bg-opacity-80 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-terminal-text flex items-center font-mono">
            <FaScroll className="mr-2" /> 
            {activeTab === 'server' ? t('logs.serverLog') : t('logs.maintenanceLog')}
          </h2>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {filteredLogs.length} {t('logs.lines')}
            </Badge>
            {autoScroll && !isUserScrolling && (
              <Badge variant="success" className="flex items-center">
                <span className="mr-1">●</span> Live
              </Badge>
            )}
          </div>
        </div>
        
        <div 
          ref={logsContainerRef}
          className="bg-black rounded p-4 overflow-y-auto font-mono text-xs sm:text-sm relative"
          style={{
            fontFamily: 'monospace',
            background: 'linear-gradient(to bottom, #000000, #001100)',
            height: `${viewerHeight}px`,
            transition: isResizing ? 'none' : 'height 0.2s ease'
          }}
        >
          {/* Load More Indicator at Top */}
          {loadingMore && (
            <div className="text-center py-2 text-zombie-green">
              <FaSpinner className="animate-spin inline mr-2" />
              Cargando logs antiguos...
            </div>
          )}
          
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <FaFileAlt className="text-5xl mx-auto mb-4 opacity-20" />
              <p>{t('none')}</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`py-1 ${getLogColor(log.type)} hover:bg-zombie-gray-dark hover:bg-opacity-30 px-2 rounded transition-colors flex flex-wrap items-start gap-2`}
              >
                <span className="text-gray-600 flex-shrink-0">{log.originalIndex + 1}.</span>
                {log.timestamp && (
                  <span className="text-zombie-green flex-shrink-0 font-bold">
                    [{log.timestamp}]
                    {formatRelativeTime(log.timestamp) && (
                      <span className="text-gray-500 text-xs ml-1">
                        ({formatRelativeTime(log.timestamp)})
                      </span>
                    )}
                  </span>
                )}
                <span className="break-all flex-1">{log.content}</span>
              </motion.div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Resize Handle */}
        <div
          className="flex items-center justify-center py-2 cursor-ns-resize hover:bg-zombie-green hover:bg-opacity-10 transition-colors border-t border-gray-700 group"
          onMouseDown={handleResizeStart}
        >
          <div className="flex flex-col items-center">
            <div className="h-1 w-12 bg-gray-600 group-hover:bg-zombie-green rounded-full mb-1"></div>
            <div className="h-1 w-12 bg-gray-600 group-hover:bg-zombie-green rounded-full"></div>
          </div>
          <span className="ml-2 text-xs text-gray-500 group-hover:text-zombie-green">
            Arrastra para redimensionar (Min: 350px, Max: 3500px)
          </span>
        </div>

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 right-6"
            >
              <Button
                variant="primary"
                onClick={handleScrollToBottom}
                className="shadow-lg flex items-center space-x-2 px-4 py-3"
              >
                <FaArrowDown className="animate-bounce" />
                <span>{t('logs.scrollToBottom')}</span>
                {!autoScroll && <span className="text-xs">(Auto-scroll OFF)</span>}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default Logs;
