import { useState } from 'react';
import { useSocket } from '@hooks/socket/useSocket';
import { FiWifi, FiWifiOff, FiRefreshCw, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * @fileoverview Debug component for visualizing socket connection status
 * Only renders in development mode
 */

/**
 * Socket connection debugger component
 * Shows connection status, errors, and manual reconnect button
 * 
 * @example
 * // In App.jsx
 * {import.meta.env.DEV && <SocketDebugger />}
 */
export const SocketDebugger = () => {
  const { socket, isConnected, isReconnecting, reconnect } = useSocket();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Only render in development
  if (!import.meta.env.DEV) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        aria-label="Show socket debugger"
      >
        <FiWifi className="w-5 h-5" />
      </button>
    );
  }

  // Connection status indicator
  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500';
    if (isReconnecting) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isReconnecting) return 'Reconnecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (isConnected) return <FiWifi className="w-4 h-4" />;
    if (isReconnecting) return <FiRefreshCw className="w-4 h-4 animate-spin" />;
    return <FiWifiOff className="w-4 h-4" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-sm">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 overflow-hidden min-w-70">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className="font-semibold text-xs">Socket Debug</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronUp className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label="Hide debugger"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3 space-y-3">
            {/* Connection Status */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon()}
                <span className="font-semibold">{getStatusText()}</span>
              </div>
              {socket?.id && (
                <div className="text-xs text-gray-400">
                  ID: <span className="text-blue-400">{socket.id}</span>
                </div>
              )}
            </div>

            {/* Socket Info */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Connected:</span>
                <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                  {isConnected ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reconnecting:</span>
                <span className={isReconnecting ? 'text-yellow-400' : 'text-gray-500'}>
                  {isReconnecting ? 'Yes' : 'No'}
                </span>
              </div>
              {socket && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transport:</span>
                    <span className="text-blue-400">
                      {socket.io?.engine?.transport?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Listeners:</span>
                    <span className="text-purple-400">
                      {120 /* Example static count; replace with actual listener count if available */}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-gray-700">
              <button
                onClick={reconnect}
                disabled={!socket || isReconnecting}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors text-xs font-semibold"
              >
                <FiRefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
                {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
              </button>
            </div>

            {/* Error Display */}
            {!isConnected && !isReconnecting && (
              <div className="p-2 bg-red-900/30 border border-red-700/50 rounded text-xs text-red-300">
                <div className="font-semibold mb-1">Connection Error</div>
                <div className="text-red-400">
                  Failed to establish socket connection. Check server status.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed View */}
        {!isExpanded && (
          <div className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocketDebugger;
