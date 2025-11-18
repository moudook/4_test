const { ipcRenderer } = require('electron');

// UI Elements
const messagesContainer = document.getElementById('messages-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const inputForm = document.getElementById('input-form');
const closeBtn = document.getElementById('close-btn');

// Recording UI Elements
const recordingControls = document.getElementById('recording-controls');
const recordingBtn = document.getElementById('recordingBtn');
const recordIcon = document.getElementById('recordIcon');
const recordingIndicator = document.getElementById('recordingIndicator');

// Source Selection Modal Elements
const sourceModal = document.getElementById('sourceModal');
const sourceList = document.getElementById('sourceList');
const sourceModalClose = document.getElementById('sourceModalClose');

// Chat state
let isProcessing = false;

// Recording state
let recordingState = {
  isRecordingVideo: false,
  isRecordingSystemAudio: false,
  isRecordingMicrophone: false,
  sessionId: null,
  videoRecorder: null,
  systemAudioRecorder: null,
  microphoneRecorder: null,
  videoChunks: [],
  systemAudioChunks: [],
  microphoneChunks: [],
  videoStream: null,
  systemAudioStream: null,
  microphoneStream: null,
  startTime: null
};

let isStarting = false;

// Close button handler
closeBtn.addEventListener('click', () => {
    ipcRenderer.send('close-chat-window');
});

// Source modal close handler
sourceModalClose.addEventListener('click', () => {
    closeSourceModal();
});

// Recording button handler
recordingBtn.addEventListener('click', async () => {
    // Prevent concurrent start attempts
    if (isStarting) {
        console.log('Recording start already in progress, ignoring click');
        return;
    }

    if (!isAnyRecording()) {
        await startRecordingFlow();
    } else {
        await stopAllRecordings();
    }
});

// Form submission handler
inputForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await sendMessage();
});

// Send message function
async function sendMessage() {
    const message = chatInput.value.trim();
    
    if (!message || isProcessing) return;
    
    // Clear input
    chatInput.value = '';
    
    // Remove welcome message if present
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    // Add user message
    addMessage(message, 'user');
    
    // Set processing state
    isProcessing = true;
    sendBtn.disabled = true;
    
    // Add loading indicator
    const loadingId = addLoadingMessage();
    
    try {
        // Get AI response
        const response = await getAIResponse(message);
        
        // Remove loading indicator
        removeLoadingMessage(loadingId);
        
        // Add AI response
        addMessage(response, 'ai');
    } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Remove loading indicator
        removeLoadingMessage(loadingId);
        
        // Add error message
        addMessage('Sorry, I encountered an error processing your request. Please try again.', 'ai');
    } finally {
        // Reset processing state
        isProcessing = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Add message to chat
function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Adjust window height after adding message
    setTimeout(adjustWindowHeight, 50);

    return messageDiv;
}

// Add loading indicator
function addLoadingMessage() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message loading';
    loadingDiv.id = 'loading-' + Date.now();
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'loading-dot';
        loadingDiv.appendChild(dot);
    }
    
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return loadingDiv.id;
}

// Remove loading indicator
function removeLoadingMessage(id) {
    const loadingDiv = document.getElementById(id);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Get AI response
async function getAIResponse(message) {
    // Get application context
    const appContext = await ipcRenderer.invoke('get-app-context');
    
    // Check if message requires web search
    const needsWebSearch = requiresWebSearch(message);
    
    // Prepare context for AI
    let contextInfo = '';
    
    if (appContext.opportunities && appContext.opportunities.length > 0) {
        contextInfo += 'Current deals in view:\n';
        appContext.opportunities.forEach((opp, index) => {
            contextInfo += `${index + 1}. ${opp.company} - ${opp.industry} (Founder: ${opp.founder})\n`;
        });
        contextInfo += '\n';
    }
    
    // Simulate AI response (In production, you would call OpenAI/Anthropic API here)
    // For now, we'll create a mock response based on the query
    let response = await generateMockAIResponse(message, contextInfo, needsWebSearch);
    
    return response;
}

// Check if message requires web search
function requiresWebSearch(message) {
    const searchKeywords = [
        'search', 'find', 'look up', 'what is', 'who is', 
        'latest', 'recent', 'news', 'current', 'today',
        'google', 'information about', 'tell me about'
    ];
    
    const lowerMessage = message.toLowerCase();
    return searchKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Generate mock AI response (Replace with actual API call in production)
async function generateMockAIResponse(message, contextInfo, needsWebSearch) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const lowerMessage = message.toLowerCase();
    
    // Context-aware responses
    if (lowerMessage.includes('deal') || lowerMessage.includes('startup')) {
        if (contextInfo) {
            return `Based on the current deals in view:\n\n${contextInfo}\nHow can I help you analyze these opportunities?`;
        } else {
            return "I don't see any deals currently loaded. Would you like me to help you search for specific startups or industries?";
        }
    }
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
        if (contextInfo) {
            return `Here's a summary of the deals:\n\n${contextInfo}\nThe portfolio includes companies across various industries with different funding rounds.`;
        } else {
            return "Please select a deal from the main view to see its summary.";
        }
    }
    
    if (needsWebSearch) {
        return `I would search the web for: "${message}"\n\n(Note: Web search integration requires API keys. In production, this would return real-time search results from the internet.)`;
    }
    
    // Default responses
    const responses = [
        `I understand you're asking about: "${message}". How can I provide more specific information about your deals?`,
        `That's an interesting question about "${message}". Would you like me to help analyze your current opportunities?`,
        `Based on your query "${message}", I can help you with deal analysis, startup research, or general information. What would you prefer?`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// ============================================================================
// RECORDING FUNCTIONS
// ============================================================================

/**
 * Helper function to check if any recording is active
 * @returns {boolean}
 */
function isAnyRecording() {
  return recordingState.isRecordingVideo ||
         recordingState.isRecordingSystemAudio ||
         recordingState.isRecordingMicrophone;
}

/**
 * Generate a session ID for the recording session
 * Format: recording_YYYYMMDD_HHMMSS
 * @returns {string}
 */
function generateSessionId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `recording_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Start the recording flow
 * @returns {Promise<void>}
 */
async function startRecordingFlow() {
  // Prevent concurrent start attempts
  if (isStarting || isAnyRecording()) {
    console.log('Recording flow already in progress or recording active');
    return;
  }

  try {
    isStarting = true;
    console.log('Starting recording flow...');

    // Disable button during initialization
    if (recordingBtn) {
      recordingBtn.disabled = true;
    }

    // Get available sources using secure IPC
    const sources = await window.backend.recording.getSources();

    if (!sources || sources.length === 0) {
      throw new Error('No screen sources available. Please ensure screen sharing permissions are granted.');
    }

    // Display sources in modal (we'll need to create this in the chat window)
    await displaySourcesAndSelect(sources);

    isStarting = false;
  } catch (error) {
    console.error('Error getting sources:', error);
    showNotification('Error', `Failed to get screen sources: ${error.message}`);

    // Reset state on error
    isStarting = false;
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
  }
}

/**
 * Display sources in modal and handle user selection
 * @param {Array} sources - Array of source objects from desktopCapturer
 * @returns {Promise<void>}
 */
async function displaySourcesAndSelect(sources) {
  try {
    // Clear existing sources
    sourceList.innerHTML = '';

    // Display each source in the modal
    sources.forEach(source => {
      const sourceItem = document.createElement('div');
      sourceItem.className = 'source-item';
      sourceItem.dataset.sourceId = source.id;

      sourceItem.innerHTML = `
        <div class="source-item-info">
          <div class="source-name">${source.name}</div>
          <div class="source-type">${source.id.includes('screen') ? '🖥️ Screen' : '🪟 Window'}</div>
        </div>
        <svg class="source-select-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      `;

      sourceItem.addEventListener('click', () => {
        selectSource(source);
      });

      sourceList.appendChild(sourceItem);
    });

    // Show modal
    sourceModal.classList.add('active');
  } catch (error) {
    console.error('Error displaying sources:', error);
    showNotification('Error', `Failed to display sources: ${error.message}`);
    isStarting = false;
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
  }
}

/**
 * Close the source selection modal
 */
function closeSourceModal() {
  sourceModal.classList.remove('active');
  sourceList.innerHTML = '';
  isStarting = false;
  if (recordingBtn) {
    recordingBtn.disabled = false;
  }
}

/**
 * Select a source and start recording
 * @param {Object} source - The selected source object
 * @returns {Promise<void>}
 */
async function selectSource(source) {
  try {
    // Validate source
    if (!source || !source.id) {
      throw new Error('Invalid source selected');
    }

    console.log('Source selected:', source.name, 'ID:', source.id.substring(0, 20) + '...');

    // Close modal
    closeSourceModal();

    // Request media stream using Electron's desktop capture API
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080
        }
      }
    });

    // Start all recordings with the obtained video stream
    await startAllRecordings(stream);

    // Reset isStarting flag after successful start
    isStarting = false;
  } catch (error) {
    console.error('Error selecting source:', error);
    isStarting = false;
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }

    let errorMessage = 'Failed to start recording. ';
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage += 'Please grant screen capture permissions and try again.';
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'The selected source is no longer available.';
    } else {
      errorMessage += error.message || 'Unknown error occurred.';
    }

    showNotification('Recording Error', errorMessage);
  }
}

/**
 * Start video recording with a media stream
 * @param {MediaStream} stream - The media stream to record
 * @returns {Promise<void>}
 */
async function startVideoRecording(stream) {
  // Check if MediaRecorder already exists and is in recording state
  if (recordingState.videoRecorder) {
    if (recordingState.videoRecorder.state === 'recording') {
      console.warn('Video recorder already in recording state, stopping previous instance');
      try {
        recordingState.videoRecorder.stop();
      } catch (error) {
        console.error('Error stopping previous video recorder:', error);
      }
    }

    // Clean up previous MediaRecorder instance
    recordingState.videoRecorder.ondataavailable = null;
    recordingState.videoRecorder.onstop = null;
    recordingState.videoRecorder.onerror = null;
    recordingState.videoRecorder = null;
  }

  // Ensure we're not already recording video
  if (recordingState.isRecordingVideo) {
    console.warn('Video recording already in progress, aborting start');
    stream.getTracks().forEach(track => track.stop());
    return;
  }

  // Store video stream
  recordingState.videoStream = stream;

  // Reset chunks array for new recording
  recordingState.videoChunks = [];

  console.log('Initializing new video recording session...');

  // Determine the best supported codec for recording
  let options;
  if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
    options = { mimeType: 'video/webm; codecs=vp9' };
  } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
    options = { mimeType: 'video/webm; codecs=vp8' };
  } else {
    options = { mimeType: 'video/webm' };
  }

  console.log('Using codec:', options.mimeType);

  // Create MediaRecorder instance
  try {
    recordingState.videoRecorder = new MediaRecorder(stream, options);
    console.log('Video recorder created, state:', recordingState.videoRecorder.state);
  } catch (error) {
    console.error('Failed to create video recorder:', error);
    stream.getTracks().forEach(track => track.stop());
    recordingState.videoStream = null;
    isStarting = false;
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
    throw new Error(`Failed to initialize video recorder: ${error.message}`);
  }

  // Set up data collection
  recordingState.videoRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordingState.videoChunks.push(event.data);
      console.log('Video chunk recorded:', event.data.size, 'bytes');
    }
  };

  // Set up error handler
  recordingState.videoRecorder.onerror = (event) => {
    console.error('Video recorder error:', event.error);
    recordingState.isRecordingVideo = false;

    // Clean up on error
    if (recordingState.videoStream) {
      recordingState.videoStream.getTracks().forEach(track => track.stop());
      recordingState.videoStream = null;
    }
  };

  // Start recording
  try {
    if (recordingState.videoRecorder.state !== 'inactive') {
      console.warn('Video recorder not in inactive state, current state:', recordingState.videoRecorder.state);
      throw new Error(`Cannot start video recording: MediaRecorder is in ${recordingState.videoRecorder.state} state`);
    }

    console.log('Starting video recorder with 1-second time slices...');
    recordingState.videoRecorder.start(1000);
    recordingState.isRecordingVideo = true;

    console.log('Video recording started successfully, state:', recordingState.videoRecorder.state);
  } catch (error) {
    console.error('Failed to start video recording:', error);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (recordingState.videoRecorder) {
      recordingState.videoRecorder.ondataavailable = null;
      recordingState.videoRecorder.onstop = null;
      recordingState.videoRecorder.onerror = null;
      recordingState.videoRecorder = null;
    }
    recordingState.videoStream = null;
    recordingState.isRecordingVideo = false;
    throw error;
  }
}

/**
 * Start system audio recording
 * @returns {Promise<void>}
 */
async function startSystemAudioRecording() {
  try {
    if (recordingState.isRecordingSystemAudio) {
      console.warn('System audio recording already in progress');
      return;
    }

    const platform = await window.backend.recording.getPlatform();
    if (platform === 'darwin') {
      console.log('System audio not supported on macOS, skipping...');
      return;
    }

    console.log('Starting system audio recording...');

    const constraints = {
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop'
        }
      },
      video: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    recordingState.systemAudioStream = stream;

    const options = { mimeType: 'audio/webm' };
    recordingState.systemAudioRecorder = new MediaRecorder(stream, options);

    recordingState.systemAudioChunks = [];

    recordingState.systemAudioRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordingState.systemAudioChunks.push(event.data);
        console.log('System audio chunk recorded:', event.data.size, 'bytes');
      }
    };

    recordingState.systemAudioRecorder.onstop = () => {
      console.log('System audio recording stopped. Total chunks:', recordingState.systemAudioChunks.length);
      if (recordingState.systemAudioStream) {
        recordingState.systemAudioStream.getTracks().forEach(track => track.stop());
        recordingState.systemAudioStream = null;
      }
    };

    recordingState.systemAudioRecorder.onerror = (event) => {
      console.error('System audio recorder error:', event.error);
      recordingState.isRecordingSystemAudio = false;
      if (recordingState.systemAudioStream) {
        recordingState.systemAudioStream.getTracks().forEach(track => track.stop());
        recordingState.systemAudioStream = null;
      }
    };

    recordingState.systemAudioRecorder.start(1000);
    recordingState.isRecordingSystemAudio = true;

    console.log('System audio recording started successfully');
  } catch (error) {
    console.error('Failed to start system audio recording:', error);
    recordingState.isRecordingSystemAudio = false;

    if (recordingState.systemAudioStream) {
      recordingState.systemAudioStream.getTracks().forEach(track => track.stop());
      recordingState.systemAudioStream = null;
    }
  }
}

/**
 * Start microphone recording
 * @returns {Promise<void>}
 */
async function startMicrophoneRecording() {
  try {
    if (recordingState.isRecordingMicrophone) {
      console.warn('Microphone recording already in progress');
      return;
    }

    console.log('Starting microphone recording...');

    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      },
      video: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    recordingState.microphoneStream = stream;

    const options = { mimeType: 'audio/webm' };
    recordingState.microphoneRecorder = new MediaRecorder(stream, options);

    recordingState.microphoneChunks = [];

    recordingState.microphoneRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordingState.microphoneChunks.push(event.data);
        console.log('Microphone chunk recorded:', event.data.size, 'bytes');
      }
    };

    recordingState.microphoneRecorder.onstop = () => {
      console.log('Microphone recording stopped. Total chunks:', recordingState.microphoneChunks.length);
      if (recordingState.microphoneStream) {
        recordingState.microphoneStream.getTracks().forEach(track => track.stop());
        recordingState.microphoneStream = null;
      }
    };

    recordingState.microphoneRecorder.onerror = (event) => {
      console.error('Microphone recorder error:', event.error);
      recordingState.isRecordingMicrophone = false;
      if (recordingState.microphoneStream) {
        recordingState.microphoneStream.getTracks().forEach(track => track.stop());
        recordingState.microphoneStream = null;
      }
    };

    recordingState.microphoneRecorder.start(1000);
    recordingState.isRecordingMicrophone = true;

    console.log('Microphone recording started successfully');
  } catch (error) {
    console.error('Failed to start microphone recording:', error);
    recordingState.isRecordingMicrophone = false;

    if (recordingState.microphoneStream) {
      recordingState.microphoneStream.getTracks().forEach(track => track.stop());
      recordingState.microphoneStream = null;
    }
  }
}

/**
 * Start all recording streams simultaneously
 * @param {MediaStream} videoStream - The video stream from screen capture
 * @returns {Promise<void>}
 */
async function startAllRecordings(videoStream) {
  try {
    recordingState.sessionId = generateSessionId();
    recordingState.startTime = Date.now();

    console.log('Starting separate recordings with session ID:', recordingState.sessionId);

    recordingState.videoStream = videoStream;

    await startVideoRecording(videoStream);
    await startSystemAudioRecording();
    await startMicrophoneRecording();

    // Start backend streaming (non-blocking)
    startBackendStreaming(recordingState.sessionId).catch(error => {
      console.warn('Backend streaming failed to start, continuing with local recording only:', error);
    });

    updateRecordingUI(recordingState);

    if (recordingBtn) {
      recordingBtn.disabled = false;
    }

    isStarting = false;

    const activeStreams = [];
    if (recordingState.isRecordingVideo) activeStreams.push('Video');
    if (recordingState.isRecordingSystemAudio) activeStreams.push('System Audio');
    if (recordingState.isRecordingMicrophone) activeStreams.push('Microphone');

    console.log('Recording started. Active streams:', activeStreams.join(' + '));

  } catch (error) {
    console.error('Failed to start recordings:', error);
    await stopAllRecordings();
    isStarting = false;
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
    showNotification('Recording Error', `Failed to start recording: ${error.message}`);
    throw error;
  }
}

/**
 * Stop all active recording streams
 * @returns {Promise<void>}
 */
async function stopAllRecordings() {
  console.log('Stop all recordings requested');

  // Stop backend streaming first
  stopBackendStreaming();

  const stopPromises = [];

  // Stop video recorder
  if (recordingState.videoRecorder && recordingState.isRecordingVideo) {
    if (recordingState.videoRecorder.state === 'recording') {
      console.log('Stopping video recorder...');
      stopPromises.push(new Promise((resolve) => {
        const originalOnStop = recordingState.videoRecorder.onstop;
        recordingState.videoRecorder.onstop = () => {
          if (originalOnStop) originalOnStop();
          console.log('Video recording stopped');
          resolve();
        };

        try {
          recordingState.videoRecorder.stop();
        } catch (error) {
          console.error('Error stopping video recorder:', error);
          resolve();
        }
      }));
    }
  }

  // Stop system audio recorder
  if (recordingState.systemAudioRecorder && recordingState.isRecordingSystemAudio) {
    if (recordingState.systemAudioRecorder.state === 'recording') {
      console.log('Stopping system audio recorder...');
      stopPromises.push(new Promise((resolve) => {
        const originalOnStop = recordingState.systemAudioRecorder.onstop;
        recordingState.systemAudioRecorder.onstop = () => {
          if (originalOnStop) originalOnStop();
          console.log('System audio recording stopped');
          resolve();
        };

        try {
          recordingState.systemAudioRecorder.stop();
        } catch (error) {
          console.error('Error stopping system audio recorder:', error);
          resolve();
        }
      }));
    }
  }

  // Stop microphone recorder
  if (recordingState.microphoneRecorder && recordingState.isRecordingMicrophone) {
    if (recordingState.microphoneRecorder.state === 'recording') {
      console.log('Stopping microphone recorder...');
      stopPromises.push(new Promise((resolve) => {
        const originalOnStop = recordingState.microphoneRecorder.onstop;
        recordingState.microphoneRecorder.onstop = () => {
          if (originalOnStop) originalOnStop();
          console.log('Microphone recording stopped');
          resolve();
        };

        try {
          recordingState.microphoneRecorder.stop();
        } catch (error) {
          console.error('Error stopping microphone recorder:', error);
          resolve();
        }
      }));
    }
  }

  await Promise.all(stopPromises);

  updateRecordingUI(recordingState);

  if (recordingBtn) {
    recordingBtn.disabled = false;
  }

  await saveAllRecordings();
}

/**
 * Save all recordings to separate files
 * @returns {Promise<void>}
 */
async function saveAllRecordings() {
  try {
    console.log('Saving all recordings...');

    const duration = recordingState.startTime
      ? Math.round((Date.now() - recordingState.startTime) / 1000)
      : 0;

    const recordingData = {
      videoBuffer: null,
      systemAudioBuffer: null,
      microphoneBuffer: null,
      sessionId: recordingState.sessionId,
      duration,
      startTime: recordingState.startTime
    };

    // Convert video chunks to buffer
    if (recordingState.videoChunks && recordingState.videoChunks.length > 0) {
      const videoBlob = new Blob(recordingState.videoChunks, { type: 'video/webm' });
      recordingData.videoBuffer = await videoBlob.arrayBuffer();
      console.log('Video buffer size:', recordingData.videoBuffer.byteLength, 'bytes');
    }

    // Convert system audio chunks to buffer
    if (recordingState.systemAudioChunks && recordingState.systemAudioChunks.length > 0) {
      const systemAudioBlob = new Blob(recordingState.systemAudioChunks, { type: 'audio/webm' });
      recordingData.systemAudioBuffer = await systemAudioBlob.arrayBuffer();
      console.log('System audio buffer size:', recordingData.systemAudioBuffer.byteLength, 'bytes');
    }

    // Convert microphone chunks to buffer
    if (recordingState.microphoneChunks && recordingState.microphoneChunks.length > 0) {
      const microphoneBlob = new Blob(recordingState.microphoneChunks, { type: 'audio/webm' });
      recordingData.microphoneBuffer = await microphoneBlob.arrayBuffer();
      console.log('Microphone buffer size:', recordingData.microphoneBuffer.byteLength, 'bytes');
    }

    const result = await window.backend.recording.saveAllRecordings(recordingData);

    if (result.success) {
      console.log('All recordings saved successfully');
      const savedCount = result.filesSaved || 0;
      showNotification('Recordings Saved', `Saved ${savedCount} file(s) to: ${result.directory}`);
    } else {
      console.error('Failed to save recordings:', result.error);
      showNotification('Error', `Failed to save recordings: ${result.error}`);
    }
  } catch (error) {
    console.error('Error saving recordings:', error);
    showNotification('Error', `Failed to process recordings: ${error.message}`);
  } finally {
    cleanupRecordingState();
  }
}

/**
 * Clean up recording state
 */
function cleanupRecordingState() {
  // Stop all streams
  if (recordingState.videoStream) {
    recordingState.videoStream.getTracks().forEach(track => track.stop());
    recordingState.videoStream = null;
  }
  if (recordingState.systemAudioStream) {
    recordingState.systemAudioStream.getTracks().forEach(track => track.stop());
    recordingState.systemAudioStream = null;
  }
  if (recordingState.microphoneStream) {
    recordingState.microphoneStream.getTracks().forEach(track => track.stop());
    recordingState.microphoneStream = null;
  }

  // Clean up recorders
  if (recordingState.videoRecorder) {
    recordingState.videoRecorder.ondataavailable = null;
    recordingState.videoRecorder.onstop = null;
    recordingState.videoRecorder.onerror = null;
    recordingState.videoRecorder = null;
  }
  if (recordingState.systemAudioRecorder) {
    recordingState.systemAudioRecorder.ondataavailable = null;
    recordingState.systemAudioRecorder.onstop = null;
    recordingState.systemAudioRecorder.onerror = null;
    recordingState.systemAudioRecorder = null;
  }
  if (recordingState.microphoneRecorder) {
    recordingState.microphoneRecorder.ondataavailable = null;
    recordingState.microphoneRecorder.onstop = null;
    recordingState.microphoneRecorder.onerror = null;
    recordingState.microphoneRecorder = null;
  }

  // Reset state
  recordingState.isRecordingVideo = false;
  recordingState.isRecordingSystemAudio = false;
  recordingState.isRecordingMicrophone = false;
  recordingState.sessionId = null;
  recordingState.videoChunks = [];
  recordingState.systemAudioChunks = [];
  recordingState.microphoneChunks = [];
  recordingState.startTime = null;

  isStarting = false;
}

/**
 * Update UI elements based on recording state
 * @param {Object} state - The recordingState object
 */
function updateRecordingUI(state) {
  if (!recordingBtn || !recordIcon || !recordingIndicator) {
    return;
  }

  const isRecording = state && (state.isRecordingVideo || state.isRecordingSystemAudio || state.isRecordingMicrophone);

  if (isRecording) {
    recordingBtn.classList.add('recording');
    recordingBtn.setAttribute('title', 'Stop Recording');
    recordIcon.innerHTML = '<rect x="8" y="8" width="8" height="8" stroke-width="0" fill="currentColor"/>';
    recordingIndicator.classList.remove('hidden');

    const activeStreams = [];
    if (state.isRecordingVideo) activeStreams.push('Video');
    if (state.isRecordingSystemAudio) activeStreams.push('System Audio');
    if (state.isRecordingMicrophone) activeStreams.push('Microphone');

    const indicatorText = recordingIndicator.querySelector('span:not(.recording-pulse)');
    if (indicatorText) {
      indicatorText.textContent = `Recording (${activeStreams.join(' + ')})...`;
    }
  } else {
    recordingBtn.classList.remove('recording');
    recordingBtn.setAttribute('title', 'Start Recording');
    recordIcon.innerHTML = '<circle cx="12" cy="12" r="6" fill="currentColor"/>';
    recordingIndicator.classList.add('hidden');
  }
}

/**
 * Show a notification to the user
 * @param {string} title - Notification title
 * @param {string} message - Notification message/content
 */
function showNotification(title, message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 24px;
    background: #ffffff;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    min-width: 300px;
    animation: slideIn 0.3s ease;
  `;

  notification.innerHTML = `
    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 13px; color: #6b7280; word-break: break-all;">${message}</div>
  `;

  document.body.appendChild(notification);

  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 5000);
}

// ============================================================================
// DYNAMIC RESIZING
// ============================================================================

/**
 * Adjust window height based on conversation content
 */
function adjustWindowHeight() {
  const messages = messagesContainer.querySelectorAll('.message');
  const messageCount = messages.length;

  // Base height for empty/minimal chat
  let targetHeight = 100; // Minimum height for search bar + controls

  if (messageCount > 1) { // More than just welcome message
    // Calculate height based on messages (approx 60px per message)
    const messagesHeight = Math.min(messageCount * 60, 400); // Cap message area height
    targetHeight = 140 + messagesHeight; // Header + controls + messages
  }

  // Ensure within bounds
  targetHeight = Math.max(100, Math.min(targetHeight, 800));

  // Send resize request to main process
  ipcRenderer.send('resize-chat-window', targetHeight);
}

// ============================================================================
// WEBSOCKET STREAMING TO BACKEND
// ============================================================================

/**
 * WebSocket connections for streaming to backend
 */
let streamingConnections = {
  video: null,
  systemAudio: null,
  microphone: null
};

/**
 * BACKEND_URL for WebSocket connections
 * TODO: Make this configurable via environment variable
 */
const BACKEND_URL = 'ws://127.0.0.1:8000';

/**
 * Establish WebSocket connection for a stream type
 * @param {string} streamType - Type of stream ('video', 'system-audio', 'microphone')
 * @param {string} sessionId - Session ID for the recording
 * @returns {Promise<WebSocket>}
 */
async function connectStream(streamType, sessionId) {
  return new Promise((resolve, reject) => {
    const wsUrl = `${BACKEND_URL}/api/streaming/ws/${streamType}/${sessionId}`;
    console.log(`Connecting to ${streamType} stream:`, wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`${streamType} stream connected`);
      resolve(ws);
    };
    
    ws.onerror = (error) => {
      console.error(`${streamType} stream error:`, error);
      reject(error);
    };
    
    ws.onclose = () => {
      console.log(`${streamType} stream closed`);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`${streamType} message from server:`, data);
        
        // Handle different message types
        if (data.type === 'status') {
          // Server acknowledged chunk receipt
          console.log(`${streamType}: ${data.message}`);
        } else if (data.type === 'error') {
          console.error(`${streamType} server error:`, data.message);
        } else if (data.type === 'transcript' && streamType === 'microphone') {
          // Handle transcription results
          console.log('Transcript:', data.text);
          // TODO: Display transcripts in UI or send to main window
        }
      } catch (error) {
        console.error(`Error parsing ${streamType} server message:`, error);
      }
    };
  });
}

/**
 * Start streaming all three streams to backend
 * @param {string} sessionId - Session ID for the recording
 */
async function startBackendStreaming(sessionId) {
  try {
    console.log('Starting backend streaming for session:', sessionId);
    
    // Connect all three WebSocket streams
    // NOTE: These connections are independent and run in parallel
    const connections = await Promise.allSettled([
      connectStream('video', sessionId),
      connectStream('system-audio', sessionId),
      connectStream('microphone', sessionId)
    ]);
    
    // Store successful connections
    if (connections[0].status === 'fulfilled') {
      streamingConnections.video = connections[0].value;
      console.log('Video stream established');
    } else {
      console.warn('Video stream failed to connect:', connections[0].reason);
    }
    
    if (connections[1].status === 'fulfilled') {
      streamingConnections.systemAudio = connections[1].value;
      console.log('System audio stream established');
    } else {
      console.warn('System audio stream failed to connect:', connections[1].reason);
    }
    
    if (connections[2].status === 'fulfilled') {
      streamingConnections.microphone = connections[2].value;
      console.log('Microphone stream established');
    } else {
      console.warn('Microphone stream failed to connect:', connections[2].reason);
    }
    
    // Set up MediaRecorder ondataavailable to send chunks to backend
    setupStreamingHandlers();
    
  } catch (error) {
    console.error('Error starting backend streaming:', error);
    // Continue with local recording even if streaming fails
  }
}

/**
 * Set up handlers to stream MediaRecorder chunks to backend
 */
function setupStreamingHandlers() {
  // Override video recorder data handler to also stream
  if (recordingState.videoRecorder && streamingConnections.video) {
    const originalVideoHandler = recordingState.videoRecorder.ondataavailable;
    recordingState.videoRecorder.ondataavailable = (event) => {
      // Call original handler (for local storage)
      if (originalVideoHandler) originalVideoHandler(event);
      
      // Also stream to backend if connection is open
      if (event.data && event.data.size > 0 && 
          streamingConnections.video && 
          streamingConnections.video.readyState === WebSocket.OPEN) {
        streamingConnections.video.send(event.data);
      }
    };
  }
  
  // Override system audio recorder data handler
  if (recordingState.systemAudioRecorder && streamingConnections.systemAudio) {
    const originalSystemAudioHandler = recordingState.systemAudioRecorder.ondataavailable;
    recordingState.systemAudioRecorder.ondataavailable = (event) => {
      if (originalSystemAudioHandler) originalSystemAudioHandler(event);
      
      if (event.data && event.data.size > 0 && 
          streamingConnections.systemAudio && 
          streamingConnections.systemAudio.readyState === WebSocket.OPEN) {
        streamingConnections.systemAudio.send(event.data);
      }
    };
  }
  
  // Override microphone recorder data handler
  if (recordingState.microphoneRecorder && streamingConnections.microphone) {
    const originalMicHandler = recordingState.microphoneRecorder.ondataavailable;
    recordingState.microphoneRecorder.ondataavailable = (event) => {
      if (originalMicHandler) originalMicHandler(event);
      
      if (event.data && event.data.size > 0 && 
          streamingConnections.microphone && 
          streamingConnections.microphone.readyState === WebSocket.OPEN) {
        streamingConnections.microphone.send(event.data);
      }
    };
  }
}

/**
 * Stop all backend streaming connections
 */
function stopBackendStreaming() {
  console.log('Stopping backend streaming...');
  
  // Send end signals and close connections
  if (streamingConnections.video && streamingConnections.video.readyState === WebSocket.OPEN) {
    try {
      streamingConnections.video.send(JSON.stringify({ type: 'end' }));
      streamingConnections.video.close();
    } catch (error) {
      console.error('Error closing video stream:', error);
    }
    streamingConnections.video = null;
  }
  
  if (streamingConnections.systemAudio && streamingConnections.systemAudio.readyState === WebSocket.OPEN) {
    try {
      streamingConnections.systemAudio.send(JSON.stringify({ type: 'end' }));
      streamingConnections.systemAudio.close();
    } catch (error) {
      console.error('Error closing system audio stream:', error);
    }
    streamingConnections.systemAudio = null;
  }
  
  if (streamingConnections.microphone && streamingConnections.microphone.readyState === WebSocket.OPEN) {
    try {
      streamingConnections.microphone.send(JSON.stringify({ type: 'end' }));
      streamingConnections.microphone.close();
    } catch (error) {
      console.error('Error closing microphone stream:', error);
    }
    streamingConnections.microphone = null;
  }
  
  console.log('All streaming connections closed');
}

// Initialize recording controls when window loads
window.addEventListener('DOMContentLoaded', () => {
    chatInput.focus();
    // Show recording controls
    if (recordingControls) {
        recordingControls.style.display = 'block';
    }

    // Initial height adjustment
    setTimeout(adjustWindowHeight, 100);
});


// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + W to close window
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        ipcRenderer.send('close-chat-window');
    }
});

/* 
 * PRODUCTION IMPLEMENTATION NOTES:
 * 
 * To integrate with real AI APIs (OpenAI/Anthropic):
 * 
 * 1. Install required packages:
 *    npm install openai
 *    or
 *    npm install @anthropic-ai/sdk
 * 
 * 2. Replace generateMockAIResponse with actual API calls:
 * 
 * For OpenAI:
 * const OpenAI = require('openai');
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * 
 * async function getAIResponse(message) {
 *     const appContext = await ipcRenderer.invoke('get-app-context');
 *     
 *     const completion = await openai.chat.completions.create({
 *         model: "gpt-4",
 *         messages: [
 *             {
 *                 role: "system",
 *                 content: "You are a helpful AI assistant for a deal flow management app. " +
 *                          "Help users analyze startups, search for information, and manage their portfolio."
 *             },
 *             {
 *                 role: "user",
 *                 content: `Context: ${JSON.stringify(appContext)}\n\nQuestion: ${message}`
 *             }
 *         ],
 *     });
 *     
 *     return completion.choices[0].message.content;
 * }
 * 
 * For Anthropic Claude:
 * const Anthropic = require('@anthropic-ai/sdk');
 * const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * 
 * async function getAIResponse(message) {
 *     const appContext = await ipcRenderer.invoke('get-app-context');
 *     
 *     const response = await anthropic.messages.create({
 *         model: "claude-3-opus-20240229",
 *         max_tokens: 1024,
 *         messages: [
 *             {
 *                 role: "user",
 *                 content: `Context: ${JSON.stringify(appContext)}\n\nQuestion: ${message}`
 *             }
 *         ],
 *     });
 *     
 *     return response.content[0].text;
 * }
 * 
 * 3. For web search integration, use a service like:
 *    - SerpAPI (serpapi.com)
 *    - Brave Search API
 *    - Google Custom Search API
 * 
 * 4. Store API keys securely using environment variables or electron-store
 */
