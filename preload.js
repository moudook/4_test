const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('backend', {
  // Startups API
  startups: {
    fetchAll: () => ipcRenderer.invoke('backend:startups:fetchAll'),
    fetchById: (id) => ipcRenderer.invoke('backend:startups:fetchById', id),
    create: (data) => ipcRenderer.invoke('backend:startups:create', data),
    update: (id, data) => ipcRenderer.invoke('backend:startups:update', id, data),
    delete: (id) => ipcRenderer.invoke('backend:startups:delete', id),
  },

  // Applications API
  applications: {
    fetchAll: () => ipcRenderer.invoke('backend:applications:fetchAll'),
    fetchPending: () => ipcRenderer.invoke('backend:applications:fetchPending'),
    fetchById: (id) => ipcRenderer.invoke('backend:applications:fetchById', id),
    create: (data) => ipcRenderer.invoke('backend:applications:create', data),
    update: (id, data) => ipcRenderer.invoke('backend:applications:update', id, data),
    delete: (id) => ipcRenderer.invoke('backend:applications:delete', id),
    accept: (id) => ipcRenderer.invoke('backend:applications:accept', id),
    reject: (id) => ipcRenderer.invoke('backend:applications:reject', id),
  },

  // Meetings API
  meetings: {
    fetchAll: () => ipcRenderer.invoke('backend:meetings:fetchAll'),
    fetchById: (id) => ipcRenderer.invoke('backend:meetings:fetchById', id),
    fetchByVc: (vcId) => ipcRenderer.invoke('backend:meetings:fetchByVc', vcId),
    create: (data) => ipcRenderer.invoke('backend:meetings:create', data),
    update: (data) => ipcRenderer.invoke('backend:meetings:update', data),
    delete: (id) => ipcRenderer.invoke('backend:meetings:delete', id),
  },

  // App IPC methods (for login, etc.)
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),

  // Backend connection status
  healthCheck: () => ipcRenderer.invoke('backend:health-check'),
  getConnectionStatus: () => ipcRenderer.invoke('backend:connection-status'),

  // Screen Recording API
  recording: {
    /**
     * Get available screen/window sources for recording
     * @returns {Promise<Array>} Array of available sources with thumbnails
     */
    getSources: () => ipcRenderer.invoke('get-sources'),

    /**
     * Get the current operating system platform
     * @returns {Promise<string>} Platform string (e.g., 'darwin', 'win32', 'linux')
     */
    getPlatform: () => ipcRenderer.invoke('get-platform'),

    /**
     * Notify main process that recording has started
     * This will trigger the chat window to open
     */
    startRecording: () => ipcRenderer.send('start-recording'),

    /**
     * Send recorded video buffer to main process for saving
     * @param {ArrayBuffer} buffer - The recorded video data as ArrayBuffer
     */
    stopRecording: (buffer) => ipcRenderer.send('stop-recording', buffer),

    /**
     * Save combined recording (video + system audio + microphone in single file) to file
     * @param {Object} data - Object containing combinedBuffer, sessionId, duration, startTime, hasVideo, hasMicrophone
     * @returns {Promise<Object>} Result object with success status and file information
     */
    saveCombinedRecording: (data) => ipcRenderer.invoke('save-combined-recording', data),

    /**
     * Save all recordings (video + system audio + microphone) to files - LEGACY
     * @param {Object} data - Object containing buffers, sessionId, duration, startTime
     * @returns {Promise<Object>} Result object with success status and file information
     */
    saveAllRecordings: (data) => ipcRenderer.invoke('save-all-recordings', data),

    /**
     * Listen for recording saved confirmation from main process
     * @param {Function} callback - Callback function that receives (event, result)
     * @returns {Function} Cleanup function to remove the listener
     */
    onRecordingSaved: (callback) => {
      const wrappedCallback = (event, result) => callback(result);
      ipcRenderer.on('recording-saved', wrappedCallback);
      // Return cleanup function
      return () => ipcRenderer.removeListener('recording-saved', wrappedCallback);
    },

    /**
     * Listen for notifications from main process
     * @param {Function} callback - Callback function that receives (event, data)
     * @returns {Function} Cleanup function to remove the listener
     */
    onShowNotification: (callback) => {
      const wrappedCallback = (event, data) => callback(data);
      ipcRenderer.on('show-notification', wrappedCallback);
      // Return cleanup function
      return () => ipcRenderer.removeListener('show-notification', wrappedCallback);
    },
  },
});

