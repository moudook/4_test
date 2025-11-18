const { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const BackendClient = require('./backend-client');

let loginWindow;
let mainWindow;
let chatWindow;
let isRecording = false;

// ============================================================================
// BACKEND CONFIGURATION
// ============================================================================

/**
 * Load API key from environment variable or .env file
 * Priority: process.env.INTERNAL_API_KEY > .env file > null
 */
function loadApiKey() {
  // First, try environment variable
  if (process.env.INTERNAL_API_KEY) {
    return process.env.INTERNAL_API_KEY;
  }

  // Try to read from .env file in project root
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('INTERNAL_API_KEY=')) {
          const apiKey = trimmed.substring('INTERNAL_API_KEY='.length).trim();
          // Remove quotes if present
          return apiKey.replace(/^["']|["']$/g, '');
        }
      }
    } catch (error) {
      console.warn('Failed to read .env file:', error.message);
    }
  }

  // Try to read from backend/.env file
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  if (fs.existsSync(backendEnvPath)) {
    try {
      const envContent = fs.readFileSync(backendEnvPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('INTERNAL_API_KEY=')) {
          const apiKey = trimmed.substring('INTERNAL_API_KEY='.length).trim();
          return apiKey.replace(/^["']|["']$/g, '');
        }
      }
    } catch (error) {
      console.warn('Failed to read backend/.env file:', error.message);
    }
  }

  return null;
}

// Load configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const INTERNAL_API_KEY = loadApiKey();

if (!INTERNAL_API_KEY) {
  console.warn('Warning: INTERNAL_API_KEY not found. Please set it in environment variable or .env file.');
  console.warn('Backend requests will fail without a valid API key.');
}

// Initialize backend client with API key
const backendClient = new BackendClient(BACKEND_URL, INTERNAL_API_KEY);

// --- Login Window ---
function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 500,
    height: 550,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false, // Creates a borderless window
    resizable: false,
    backgroundColor: '#1a1a1a'
  });

  loginWindow.loadFile('login.html');

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

// --- Main Application Window ---
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile('app/main.html');
  
  // Open DevTools in development (optional - remove in production)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    // Close chat window if it exists
    if (chatWindow) {
      chatWindow.close();
      chatWindow = null;
    }
    mainWindow = null;
    app.quit();
  });
  
  // Register global shortcuts once the window is shown
  mainWindow.on('show', () => {
    globalShortcut.register('CommandOrControl+B', () => {
      // Send a message to the renderer process to toggle the left panel
      mainWindow.webContents.send('toggle-left-panel');
    });

    globalShortcut.register('CommandOrControl+Alt+B', () => {
      // Send a message to the renderer process to toggle the right panel
      mainWindow.webContents.send('toggle-right-panel');
    });
  });
}

// --- AI Chat Window ---
function createChatWindow() {
  // Prevent multiple chat windows
  if (chatWindow && !chatWindow.isDestroyed()) {
    console.log('Chat window already exists, focusing instead of creating new one');
    chatWindow.focus();
    return chatWindow;
  }

  chatWindow = new BrowserWindow({
    width: 500,
    height: 100, // Start with small height (search bar size)
    minWidth: 400,
    maxWidth: 800,
    minHeight: 60, // Minimum height for search bar
    maxHeight: 800, // Maximum height to prevent excessive growth
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    show: false, // Don't show immediately to prevent flicker
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: 'rgba(27, 28, 32, 0.95)' // Semi-transparent background
  });

  chatWindow.loadFile('app/chat-window.html');

  // Show window once it's ready to prevent visual glitches
  chatWindow.once('ready-to-show', () => {
    chatWindow.show();
  });

  chatWindow.on('closed', () => {
    chatWindow = null;
  });

  // Handle window resize to maintain proper proportions
  chatWindow.on('resize', () => {
    // Ensure window maintains reasonable proportions
    const [width, height] = chatWindow.getSize();
    if (width > 600 && height < 200) {
      // If width is large but height is small, increase height proportionally
      const newHeight = Math.min(Math.max(height, Math.round(width * 0.3)), 800);
      chatWindow.setSize(width, newHeight);
    }
  });

  // Prevent multiple instances by checking if window already exists
  chatWindow.on('focus', () => {
    // Ensure only one chat window is focused at a time
    if (chatWindow && !chatWindow.isDestroyed()) {
      // Bring to front if multiple windows exist
      chatWindow.moveTop();
    }
  });

  return chatWindow;
}

// --- Data Mapping Functions ---
/**
 * Map backend Application model to UI data structure
 */
function mapApplicationToUIData(application) {
  const dateAdded = application.dateAdded 
    ? new Date(application.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  const reminderDate = application.reminders
    ? (Array.isArray(application.reminders) ? application.reminders[0] : application.reminders)
    : null;
  
  return {
    id: application.id,
    company: application.companyName || '-',
    industry: application.industry || '-',
    location: application.location || '-',
    founderName: application.founderName || '-',
    founderContact: application.founderContact || '-',
    round: application.roundType || '-',
    amount: application.amountRaising ? (typeof application.amountRaising === 'string' ? application.amountRaising : `$${application.amountRaising}`) : '-',
    valuation: application.valuation ? (typeof application.valuation === 'string' ? application.valuation : `$${application.valuation}`) : '-',
    status: application.stage || application.status || 'Source',
    dealLead: application.dealLeadVCId || '-',
    dateAdded: dateAdded,
    source: application.source || '-',
    summary: application.description || '-',
    notes: application.dueDiligenceSummary ? JSON.stringify(application.dueDiligenceSummary) : '-',
    deckLink: application.pitchDeckPath || application.pitchDeckUrl || '',
    cplLink: '', // Not in backend model
    keyInsight: application.keyInsight || '-',
    nextAction: reminderDate || '-',
    reminderDate: reminderDate || '-',
    link: `https://${(application.companyName || '').toLowerCase().replace(/\s+/g, '')}.example.com`
  };
}

/**
 * Map UI data structure to backend ApplicationUpdate model
 */
function mapUIDataToApplicationUpdate(uiData) {
  const update = {};
  
  if (uiData.company) update.companyName = uiData.company;
  if (uiData.industry) update.industry = uiData.industry;
  if (uiData.location) update.location = uiData.location;
  if (uiData.founderName) update.founderName = uiData.founderName;
  if (uiData.founderContact) update.founderContact = uiData.founderContact;
  if (uiData.round) update.roundType = uiData.round;
  if (uiData.amount) {
    const amountValue = uiData.amount.replace(/[^0-9.]/g, '');
    update.amountRaising = amountValue ? parseFloat(amountValue) : null;
  }
  if (uiData.valuation) {
    const valuationValue = uiData.valuation.replace(/[^0-9.]/g, '');
    update.valuation = valuationValue ? parseFloat(valuationValue) : null;
  }
  if (uiData.status) update.stage = uiData.status;
  if (uiData.dealLead) update.dealLeadVCId = uiData.dealLead;
  if (uiData.source) update.source = uiData.source;
  if (uiData.summary) update.description = uiData.summary;
  if (uiData.deckLink) update.pitchDeckPath = uiData.deckLink;
  if (uiData.keyInsight) update.keyInsight = uiData.keyInsight;
  if (uiData.reminderDate) update.reminders = uiData.reminderDate;
  if (uiData.notes) {
    try {
      update.dueDiligenceSummary = JSON.parse(uiData.notes);
    } catch {
      update.dueDiligenceSummary = { notes: uiData.notes };
    }
  }
  
  return update;
}

/**
 * Map UI data structure to backend ApplicationCreate model
 */
function mapUIDataToApplicationCreate(uiData) {
  const create = {};
  
  if (uiData.company) create.companyName = uiData.company;
  if (uiData.industry) create.industry = uiData.industry;
  if (uiData.location) create.location = uiData.location;
  if (uiData.founderName) create.founderName = uiData.founderName;
  if (uiData.founderContact) create.founderContact = uiData.founderContact;
  if (uiData.round) create.roundType = uiData.round;
  if (uiData.amount) {
    const amountValue = uiData.amount.replace(/[^0-9.]/g, '');
    create.amountRaising = amountValue ? parseFloat(amountValue) : null;
  }
  if (uiData.valuation) {
    const valuationValue = uiData.valuation.replace(/[^0-9.]/g, '');
    create.valuation = valuationValue ? parseFloat(valuationValue) : null;
  }
  if (uiData.status) create.stage = uiData.status;
  if (uiData.dealLead) create.dealLeadVCId = uiData.dealLead;
  if (uiData.source) create.source = uiData.source;
  if (uiData.summary) create.description = uiData.summary;
  if (uiData.deckLink) create.pitchDeckPath = uiData.deckLink;
  if (uiData.keyInsight) create.keyInsight = uiData.keyInsight;
  if (uiData.reminderDate) create.reminders = uiData.reminderDate;
  if (uiData.notes) {
    try {
      create.dueDiligenceSummary = JSON.parse(uiData.notes);
    } catch {
      create.dueDiligenceSummary = { notes: uiData.notes };
    }
  }
  
  return create;
}

// --- Backend IPC Handlers ---

// Startups IPC Handlers
ipcMain.handle('backend:startups:fetchAll', async () => {
  try {
    const response = await backendClient.fetchAllStartups();
    return { success: true, data: response.data || [] };
  } catch (error) {
    console.error('Error fetching all startups:', error);
    return { success: false, error: error.message || 'Failed to fetch startups' };
  }
});

ipcMain.handle('backend:startups:fetchById', async (event, id) => {
  try {
    const response = await backendClient.fetchStartupById(id);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching startup:', error);
    return { success: false, error: error.message || 'Failed to fetch startup' };
  }
});

ipcMain.handle('backend:startups:create', async (event, data) => {
  try {
    const response = await backendClient.createStartup(data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error creating startup:', error);
    return { success: false, error: error.message || 'Failed to create startup' };
  }
});

ipcMain.handle('backend:startups:update', async (event, id, data) => {
  try {
    const response = await backendClient.updateStartup(id, data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error updating startup:', error);
    return { success: false, error: error.message || 'Failed to update startup' };
  }
});

ipcMain.handle('backend:startups:delete', async (event, id) => {
  try {
    const response = await backendClient.deleteStartup(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error deleting startup:', error);
    return { success: false, error: error.message || 'Failed to delete startup' };
  }
});

// Applications IPC Handlers
ipcMain.handle('backend:applications:fetchAll', async () => {
  try {
    const response = await backendClient.fetchAllApplications();
    const applications = response.data || [];
    // Map to UI format
    const uiData = applications.map(mapApplicationToUIData);
    return { success: true, data: uiData };
  } catch (error) {
    console.error('Error fetching all applications:', error);
    return { success: false, error: error.message || 'Failed to fetch applications' };
  }
});

ipcMain.handle('backend:applications:fetchPending', async () => {
  try {
    const response = await backendClient.fetchPendingApplications();
    const applications = response.data || [];
    const uiData = applications.map(mapApplicationToUIData);
    return { success: true, data: uiData };
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    return { success: false, error: error.message || 'Failed to fetch pending applications' };
  }
});

ipcMain.handle('backend:applications:fetchById', async (event, id) => {
  try {
    const response = await backendClient.fetchApplicationById(id);
    const uiData = mapApplicationToUIData(response.data);
    return { success: true, data: uiData };
  } catch (error) {
    console.error('Error fetching application:', error);
    return { success: false, error: error.message || 'Failed to fetch application' };
  }
});

ipcMain.handle('backend:applications:create', async (event, uiData) => {
  try {
    const createData = mapUIDataToApplicationCreate(uiData);
    const response = await backendClient.createApplication(createData);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error creating application:', error);
    return { success: false, error: error.message || 'Failed to create application' };
  }
});

ipcMain.handle('backend:applications:update', async (event, id, uiData) => {
  try {
    const updateData = mapUIDataToApplicationUpdate(uiData);
    const response = await backendClient.updateApplication(id, updateData);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error updating application:', error);
    return { success: false, error: error.message || 'Failed to update application' };
  }
});

ipcMain.handle('backend:applications:delete', async (event, id) => {
  try {
    const response = await backendClient.deleteApplication(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error deleting application:', error);
    return { success: false, error: error.message || 'Failed to delete application' };
  }
});

ipcMain.handle('backend:applications:accept', async (event, id) => {
  try {
    const response = await backendClient.acceptApplication(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error accepting application:', error);
    return { success: false, error: error.message || 'Failed to accept application' };
  }
});

ipcMain.handle('backend:applications:reject', async (event, id) => {
  try {
    const response = await backendClient.rejectApplication(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error rejecting application:', error);
    return { success: false, error: error.message || 'Failed to reject application' };
  }
});

// Meetings IPC Handlers
ipcMain.handle('backend:meetings:fetchAll', async () => {
  try {
    const response = await backendClient.fetchAllMeetings();
    return { success: true, data: response.data || [] };
  } catch (error) {
    console.error('Error fetching all meetings:', error);
    return { success: false, error: error.message || 'Failed to fetch meetings' };
  }
});

ipcMain.handle('backend:meetings:fetchById', async (event, id) => {
  try {
    const response = await backendClient.fetchMeetingById(id);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return { success: false, error: error.message || 'Failed to fetch meeting' };
  }
});

ipcMain.handle('backend:meetings:fetchByVc', async (event, vcId) => {
  try {
    const response = await backendClient.fetchMeetingsByVc(vcId);
    return { success: true, data: response.data || [] };
  } catch (error) {
    console.error('Error fetching meetings by VC:', error);
    return { success: false, error: error.message || 'Failed to fetch meetings' };
  }
});

ipcMain.handle('backend:meetings:create', async (event, data) => {
  try {
    const response = await backendClient.createMeeting(data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error creating meeting:', error);
    return { success: false, error: error.message || 'Failed to create meeting' };
  }
});

ipcMain.handle('backend:meetings:update', async (event, data) => {
  try {
    const response = await backendClient.updateMeeting(data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error updating meeting:', error);
    return { success: false, error: error.message || 'Failed to update meeting' };
  }
});

ipcMain.handle('backend:meetings:delete', async (event, id) => {
  try {
    const response = await backendClient.deleteMeeting(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return { success: false, error: error.message || 'Failed to delete meeting' };
  }
});

// --- IPC Communication ---
ipcMain.on('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
  }
  createMainWindow();
});

ipcMain.on('close-login-window', () => {
  if (loginWindow) {
    loginWindow.close();
  }
});

// ============================================================================
// SCREEN RECORDING IPC HANDLERS
// ============================================================================

/**
 * Get available screen/window sources for recording
 * 
 * Uses Electron's desktopCapturer API to get a list of available
 * screens and windows that can be recorded. Returns sources with
 * thumbnails for user selection.
 * 
 * @returns {Promise<Array>} Array of source objects with id, name, and thumbnail
 */
ipcMain.handle('get-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ['window', 'screen'], // Include both windows and entire screens
      thumbnailSize: { width: 150, height: 150 } // Thumbnail size for preview
    });
    
    console.log(`Found ${sources.length} raw recording source(s)`);
    
    // ========================================================================
    // SOURCE FILTERING AND DEDUPLICATION
    // ========================================================================
    
    // Patterns to exclude system/overlay windows
    const excludedPatterns = [
      'NVIDIA',
      'AsH',
      'AsHotplugCtrl',
      'AsHDRControl',
      'Build Full Apps'
    ];
    
    // Track unique sources by ID and name
    const uniqueById = new Map();
    const seenNames = new Set();
    const filteredSources = [];
    
    for (const source of sources) {
      // Validate source has required properties
      if (!source.id || !source.name) {
        console.warn('Skipping source with missing id or name:', source);
        continue;
      }
      
      // Skip if ID already seen (duplicate by ID)
      if (uniqueById.has(source.id)) {
        console.log(`Filtered duplicate source by ID: ${source.name} (${source.id})`);
        continue;
      }
      
      // Skip if name already seen (duplicate by name - keep first occurrence)
      if (seenNames.has(source.name)) {
        console.log(`Filtered duplicate source by name: ${source.name} (${source.id})`);
        continue;
      }
      
      // Skip system/overlay windows
      const shouldExclude = excludedPatterns.some(pattern => 
        source.name.startsWith(pattern)
      );
      
      if (shouldExclude) {
        console.log(`Filtered excluded system window: ${source.name}`);
        continue;
      }
      
      // Source passed all filters - add it
      uniqueById.set(source.id, source);
      seenNames.add(source.name);
      filteredSources.push(source);
    }
    
    console.log(`Filtered to ${filteredSources.length} unique recording source(s)`);
    console.log('Available sources:', filteredSources.map(s => `${s.name} (${s.id.substring(0, 20)}...)`).join(', '));
    
    return filteredSources;
  } catch (error) {
    console.error('Error getting screen sources:', error);
    // Return empty array on error so UI can handle gracefully
    return [];
  }
});

/**
 * Legacy recording start handler - no longer used
 * Recording functionality has been moved to chat-window.js
 */

/**
 * Legacy recording stop handler - no longer used
 * Recording functionality has been moved to chat-window.js
 */

ipcMain.on('close-chat-window', () => {
  if (chatWindow) {
    chatWindow.close();
    chatWindow = null;
  }
});

ipcMain.on('resize-chat-window', (event, height) => {
  if (chatWindow && !chatWindow.isDestroyed()) {
    const [currentWidth] = chatWindow.getSize();
    chatWindow.setSize(currentWidth, height, true); // Animate resize
  }
});

ipcMain.on('open-chat-window', () => {
  if (!chatWindow || chatWindow.isDestroyed()) {
    createChatWindow();
  } else {
    chatWindow.focus();
  }
});

// Backend connection status IPC handlers
ipcMain.handle('backend:health-check', async () => {
  try {
    const isHealthy = await backendClient.healthCheck();
    return { success: true, connected: isHealthy, status: backendClient.getConnectionStatus() };
  } catch (error) {
    return { success: false, connected: false, status: 'disconnected', error: error.message };
  }
});

ipcMain.handle('backend:connection-status', () => {
  return { status: backendClient.getConnectionStatus() };
});

/**
 * Get the current operating system platform
 * Used to detect macOS for system audio compatibility
 */
ipcMain.handle('get-platform', () => {
  return process.platform;
});

/**
 * Handle saving combined recording (video + system audio + microphone in single file)
 *
 * This handler:
 * 1. Shows directory selection dialog
 * 2. Saves the combined WebM file with session ID
 * 3. Creates metadata file
 * 4. Returns success status
 *
 * @param {IpcMainInvokeEvent} event - IPC event object
 * @param {Object} data - Object containing combinedBuffer, sessionId, duration, startTime, hasVideo, hasMicrophone
 */
ipcMain.handle('save-all-recordings', async (event, data) => {
  const { videoBuffer, systemAudioBuffer, microphoneBuffer, sessionId, duration, startTime } = data;

  isRecording = false;
  console.log('Received save-all-recordings request for session:', sessionId);

  try {
    // Show directory selection dialog
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Directory to Save Recordings',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Select Folder'
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      console.log('Directory selection canceled');
      return {
        success: false,
        error: 'Directory selection canceled by user'
      };
    }

    const saveDirectory = result.filePaths[0];
    console.log('Saving recordings to directory:', saveDirectory);

    const savedFiles = [];
    const fileErrors = [];

    // Save video file
    if (videoBuffer && videoBuffer.byteLength > 0) {
      try {
        const videoFileName = `${sessionId}.webm`;
        const videoFilePath = path.join(saveDirectory, videoFileName);
        fs.writeFileSync(videoFilePath, Buffer.from(videoBuffer));
        savedFiles.push(videoFileName);
        console.log('Video saved:', videoFilePath, 'Size:', videoBuffer.byteLength, 'bytes');
      } catch (error) {
        console.error('Error saving video:', error);
        fileErrors.push(`Video: ${error.message}`);
      }
    }

    // Save system audio file
    if (systemAudioBuffer && systemAudioBuffer.byteLength > 0) {
      try {
        const systemAudioFileName = `${sessionId}_system-audio.webm`;
        const systemAudioFilePath = path.join(saveDirectory, systemAudioFileName);
        fs.writeFileSync(systemAudioFilePath, Buffer.from(systemAudioBuffer));
        savedFiles.push(systemAudioFileName);
        console.log('System audio saved:', systemAudioFilePath, 'Size:', systemAudioBuffer.byteLength, 'bytes');
      } catch (error) {
        console.error('Error saving system audio:', error);
        fileErrors.push(`System Audio: ${error.message}`);
      }
    }

    // Save microphone file
    if (microphoneBuffer && microphoneBuffer.byteLength > 0) {
      try {
        const microphoneFileName = `${sessionId}_microphone.webm`;
        const microphoneFilePath = path.join(saveDirectory, microphoneFileName);
        fs.writeFileSync(microphoneFilePath, Buffer.from(microphoneBuffer));
        savedFiles.push(microphoneFileName);
        console.log('Microphone saved:', microphoneFilePath, 'Size:', microphoneBuffer.byteLength, 'bytes');
      } catch (error) {
        console.error('Error saving microphone:', error);
        fileErrors.push(`Microphone: ${error.message}`);
      }
    }

    // Create metadata file
    try {
      const metadataFileName = `${sessionId}_info.txt`;
      const metadataFilePath = path.join(saveDirectory, metadataFileName);

      const recordingDate = startTime ? new Date(startTime).toISOString() : new Date().toISOString();
      const durationStr = duration ? `${duration} seconds` : 'Unknown';

      const metadata = [
        'Recording Session Information',
        '============================',
        '',
        `Session ID: ${sessionId}`,
        `Recording Date/Time: ${recordingDate}`,
        `Duration: ${durationStr}`,
        '',
        'Files Saved:',
        ...savedFiles.map(file => `  - ${file}`),
        '',
        'Recording Quality/Format:',
        '  - Video: WebM (VP9/VP8 codec)',
        '  - System Audio: WebM (audio only)',
        '  - Microphone: WebM (audio only)',
        '',
        `Total Files: ${savedFiles.length}`,
        ...(fileErrors.length > 0 ? ['', 'Errors:', ...fileErrors.map(err => `  - ${err}`)] : [])
      ].join('\n');

      fs.writeFileSync(metadataFilePath, metadata, 'utf8');
      console.log('Metadata file saved:', metadataFilePath);
    } catch (error) {
      console.error('Error saving metadata file:', error);
      fileErrors.push(`Metadata: ${error.message}`);
    }

    // Close chat window after recording stops
    if (chatWindow) {
      chatWindow.close();
      chatWindow = null;
    }

    // Return result
    if (savedFiles.length === 0) {
      return {
        success: false,
        error: 'No files were saved. All recordings may have been empty or failed.',
        filesSaved: 0,
        directory: saveDirectory
      };
    }

    return {
      success: true,
      filesSaved: savedFiles.length,
      directory: saveDirectory,
      files: savedFiles,
      ...(fileErrors.length > 0 && { warnings: fileErrors })
    };
  } catch (error) {
    console.error('Error processing save-all-recordings:', error);

    // Close chat window on error
    if (chatWindow) {
      chatWindow.close();
      chatWindow = null;
    }

    return {
      success: false,
      error: `Failed to save recordings: ${error.message}`,
      filesSaved: 0
    };
  }
});


// Get application data for AI context
ipcMain.handle('get-app-context', async () => {
  if (mainWindow) {
    const appData = await mainWindow.webContents.executeJavaScript(`
      (function() {
        // Get visible data from the main window
        const opportunities = Array.from(document.querySelectorAll('.opportunity-row')).map(row => {
          return {
            company: row.querySelector('.company-name')?.textContent,
            industry: row.querySelector('.industry')?.textContent,
            founder: row.querySelector('.founder-name')?.textContent
          };
        }).filter(item => item.company);
        
        return {
          opportunities: opportunities.slice(0, 10), // Limit to 10 items
          currentView: document.title || 'Deal Flow'
        };
      })()
    `);
    return appData;
  }
  return { opportunities: [], currentView: 'Unknown' };
});

// --- App Lifecycle ---
app.whenReady().then(createLoginWindow);

app.on('window-all-closed', () => {
  // Unregister all shortcuts before quitting
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoginWindow();
  }
});