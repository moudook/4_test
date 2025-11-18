/**
 * Screen Recording Module
 * 
 * This module handles screen recording functionality using Electron's desktopCapturer
 * and the browser's MediaRecorder API. It provides a complete recording solution with
 * source selection, recording management, and file saving.
 * 
 * Security: Uses contextBridge API (window.backend.recording) instead of direct
 * ipcRenderer access for secure IPC communication.
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Comprehensive recording state object tracking all streams
 * @type {Object}
 */
let recordingState = {
  // Recording flags
  isRecordingVideo: false,
  isRecordingSystemAudio: false,
  isRecordingMicrophone: false,
  
  // Session ID for file naming
  sessionId: null,
  
  // MediaRecorder instances
  videoRecorder: null,
  systemAudioRecorder: null,
  microphoneRecorder: null,
  
  // Data chunks
  videoChunks: [],
  systemAudioChunks: [],
  microphoneChunks: [],
  
  // Media streams
  videoStream: null,
  systemAudioStream: null,
  microphoneStream: null,
  
  // Recording start time for duration tracking
  startTime: null
};

/**
 * Flag to prevent concurrent start attempts
 * @type {boolean}
 */
let isStarting = false;

/**
 * Cleanup functions for IPC event listeners
 * @type {Array<Function>}
 */
let cleanupListeners = [];

/**
 * Helper function to check if any recording is active
 * @returns {boolean}
 */
function isAnyRecording() {
  return recordingState.isRecordingVideo || 
         recordingState.isRecordingSystemAudio || 
         recordingState.isRecordingMicrophone;
}

// ============================================================================
// UI ELEMENTS
// ============================================================================

/**
 * Recording controls have been moved to chat-window.html
 * This file now only contains legacy functions that are no longer used
 * in the main application window.
 */

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Legacy initialization - no longer used
 * Recording functionality has been moved to chat-window.js
 */
function initializeRecording() {
  console.log('Recording functionality has been moved to chat window. This initialization is no longer needed.');
}

/**
 * Legacy IPC listeners - no longer used
 * Recording functionality has been moved to chat-window.js
 */

// ============================================================================
// RECORDING FLOW
// ============================================================================

/**
 * Start the recording flow
 * 
 * This function initiates the recording process by:
 * 1. Fetching available screen/window sources
 * 2. Displaying them in a modal for user selection
 * 3. Starting recording once a source is selected
 * 
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
    
    // Display sources in modal
    displaySources(sources);
    
    // Show modal for user selection
    sourceModal.classList.remove('hidden');
    
    // Re-enable button after sources are loaded
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
    
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
 * Display available sources in the selection modal
 *
 * Creates UI elements for each available source (screen or window)
 * with text-only display (no thumbnails to prevent GPU crashes).
 *
 * @param {Array} sources - Array of source objects from desktopCapturer
 */
function displaySources(sources) {
  if (!sourcesList) {
    console.error('Sources list element not found');
    return;
  }

  // Clear existing sources
  sourcesList.innerHTML = '';

  // Create UI element for each source
  sources.forEach(source => {
    const sourceItem = document.createElement('div');
    sourceItem.className = 'source-item';

    // Create name display
    const nameDiv = document.createElement('div');
    nameDiv.className = 'source-name';
    nameDiv.textContent = source.name;

    // Create type indicator (Screen or Window)
    const typeDiv = document.createElement('div');
    typeDiv.className = 'source-type';
    typeDiv.textContent = source.id.includes('screen') ? 'Screen' : 'Window';

    // Assemble the source item (no thumbnail)
    sourceItem.appendChild(nameDiv);
    sourceItem.appendChild(typeDiv);

    // Add click handler to select this source
    sourceItem.addEventListener('click', () => {
      selectSource(source);
    });

    // Add to list
    sourcesList.appendChild(sourceItem);
  });
}

/**
 * Select a source and start recording
 * 
 * This function:
 * 1. Closes the source selection modal
 * 2. Requests media stream for the selected source
 * 3. Starts recording with the stream
 * 
 * @param {Object} source - The selected source object with id and name
 * @returns {Promise<void>}
 */
async function selectSource(source) {
  try {
    // Validate source before proceeding
    if (!source || !source.id) {
      throw new Error('Invalid source selected');
    }
    
    console.log('Source selected:', source.name, 'ID:', source.id.substring(0, 20) + '...');
    
    // Close modal first
    sourceModal.classList.add('hidden');
    
    // Request media stream using Electron's desktop capture API
    // Include audio constraints for system audio capture
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop', // Electron-specific: system audio capture
          chromeMediaSourceId: source.id
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: 'desktop', // Electron-specific: indicates desktop capture
          chromeMediaSourceId: source.id, // The selected source ID
          minWidth: 1280, // Minimum resolution
          maxWidth: 1920, // Maximum resolution
          minHeight: 720,
          maxHeight: 1080
        }
      }
    });
    
    // Start all recordings (video + audio streams) with the obtained video stream
    await startAllRecordings(stream);
    
    // Reset isStarting flag after successful start
    isStarting = false;
  } catch (error) {
    console.error('Error selecting source:', error);
    
    // Reset isStarting flag on error
    isStarting = false;
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
    
    // Provide user-friendly error messages
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

// ============================================================================
// AUDIO RECORDING FUNCTIONS
// ============================================================================

/**
 * Start system audio recording
 * Captures audio from system speakers/audio output
 * Note: Not supported on macOS
 * 
 * @returns {Promise<void>}
 */
async function startSystemAudioRecording() {
  try {
    // Check if already recording
    if (recordingState.isRecordingSystemAudio) {
      console.warn('System audio recording already in progress');
      return;
    }

    // Check for macOS (system audio not supported)
    const platform = await window.backend.recording.getPlatform();
    if (platform === 'darwin') {
      console.log('System audio not supported on macOS, skipping...');
      return;
    }

    console.log('Starting system audio recording...');
    
    // System audio constraints using Electron's desktop capture
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
    
    // Create MediaRecorder for audio
    const options = { mimeType: 'audio/webm' };
    recordingState.systemAudioRecorder = new MediaRecorder(stream, options);
    
    // Reset chunks
    recordingState.systemAudioChunks = [];
    
    // Set up data collection
    recordingState.systemAudioRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordingState.systemAudioChunks.push(event.data);
        console.log('System audio chunk recorded:', event.data.size, 'bytes');
      }
    };
    
    // Set up stop handler
    recordingState.systemAudioRecorder.onstop = () => {
      console.log('System audio recording stopped. Total chunks:', recordingState.systemAudioChunks.length);
      if (recordingState.systemAudioStream) {
        recordingState.systemAudioStream.getTracks().forEach(track => track.stop());
        recordingState.systemAudioStream = null;
      }
    };
    
    // Set up error handler
    recordingState.systemAudioRecorder.onerror = (event) => {
      console.error('System audio recorder error:', event.error);
      recordingState.isRecordingSystemAudio = false;
      if (recordingState.systemAudioStream) {
        recordingState.systemAudioStream.getTracks().forEach(track => track.stop());
        recordingState.systemAudioStream = null;
      }
    };
    
    // Start recording
    recordingState.systemAudioRecorder.start(1000);
    recordingState.isRecordingSystemAudio = true;
    
    console.log('System audio recording started successfully');
  } catch (error) {
    console.error('Failed to start system audio recording:', error);
    recordingState.isRecordingSystemAudio = false;
    
    // Clean up on error
    if (recordingState.systemAudioStream) {
      recordingState.systemAudioStream.getTracks().forEach(track => track.stop());
      recordingState.systemAudioStream = null;
    }
    
    // Don't throw - allow other streams to continue
    // Error will be logged and UI will reflect which streams are active
  }
}

/**
 * Start microphone recording
 * Captures audio from user's microphone input
 * 
 * @returns {Promise<void>}
 */
async function startMicrophoneRecording() {
  try {
    // Check if already recording
    if (recordingState.isRecordingMicrophone) {
      console.warn('Microphone recording already in progress');
      return;
    }

    console.log('Starting microphone recording...');
    
    // Microphone audio constraints
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      },
      video: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    recordingState.microphoneStream = stream;
    
    // Create MediaRecorder for audio
    const options = { mimeType: 'audio/webm' };
    recordingState.microphoneRecorder = new MediaRecorder(stream, options);
    
    // Reset chunks
    recordingState.microphoneChunks = [];
    
    // Set up data collection
    recordingState.microphoneRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordingState.microphoneChunks.push(event.data);
        console.log('Microphone chunk recorded:', event.data.size, 'bytes');
      }
    };
    
    // Set up stop handler
    recordingState.microphoneRecorder.onstop = () => {
      console.log('Microphone recording stopped. Total chunks:', recordingState.microphoneChunks.length);
      if (recordingState.microphoneStream) {
        recordingState.microphoneStream.getTracks().forEach(track => track.stop());
        recordingState.microphoneStream = null;
      }
    };
    
    // Set up error handler
    recordingState.microphoneRecorder.onerror = (event) => {
      console.error('Microphone recorder error:', event.error);
      recordingState.isRecordingMicrophone = false;
      if (recordingState.microphoneStream) {
        recordingState.microphoneStream.getTracks().forEach(track => track.stop());
        recordingState.microphoneStream = null;
      }
    };
    
    // Start recording
    recordingState.microphoneRecorder.start(1000);
    recordingState.isRecordingMicrophone = true;
    
    console.log('Microphone recording started successfully');
  } catch (error) {
    console.error('Failed to start microphone recording:', error);
    recordingState.isRecordingMicrophone = false;
    
    // Clean up on error
    if (recordingState.microphoneStream) {
      recordingState.microphoneStream.getTracks().forEach(track => track.stop());
      recordingState.microphoneStream = null;
    }
    
    // Don't throw - allow other streams to continue
    // Error will be logged and UI will reflect which streams are active
  }
}

// ============================================================================
// COMBINED RECORDING FUNCTION
// ============================================================================

/**
 * Start combined recording with video and audio streams
 *
 * This function:
 * 1. Detects the best supported video codec for combined streams
 * 2. Creates a single MediaRecorder instance for all tracks
 * 3. Sets up event handlers for data collection
 * 4. Starts recording
 *
 * @param {MediaStream} stream - The combined media stream (video + audio)
 * @returns {Promise<void>}
 */
async function startCombinedRecording(stream) {
  // ========================================================================
  // STATE VALIDATION AND CLEANUP
  // ========================================================================
  // Check if MediaRecorder already exists and is in recording state
  if (recordingState.videoRecorder) {
    if (recordingState.videoRecorder.state === 'recording') {
      console.warn('Combined recorder already in recording state, stopping previous instance');
      try {
        recordingState.videoRecorder.stop();
      } catch (error) {
        console.error('Error stopping previous recorder:', error);
      }
    }

    // Clean up previous MediaRecorder instance
    recordingState.videoRecorder.ondataavailable = null;
    recordingState.videoRecorder.onstop = null;
    recordingState.videoRecorder.onerror = null;
    recordingState.videoRecorder = null;
  }

  // Ensure we're not already recording
  if (recordingState.isRecordingVideo) {
    console.warn('Recording already in progress, aborting start');
    stream.getTracks().forEach(track => track.stop());
    return;
  }

  // Store the combined stream
  recordingState.videoStream = stream;

  // Reset chunks array for new recording
  recordingState.videoChunks = [];

  console.log('Initializing combined recording session...');

  // ========================================================================
  // CODEC SELECTION
  // ========================================================================
  // Determine the best supported codec for combined recording
  let options;
  if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
    options = { mimeType: 'video/webm; codecs=vp9' };
  } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
    options = { mimeType: 'video/webm; codecs=vp8' };
  } else {
    // Fallback to basic WebM if codecs not supported
    options = { mimeType: 'video/webm' };
  }

  console.log('Using codec for combined recording:', options.mimeType);

  // ========================================================================
  // MEDIARECORDER SETUP
  // ========================================================================
  try {
    recordingState.videoRecorder = new MediaRecorder(stream, options);
    console.log('Combined recorder created, state:', recordingState.videoRecorder.state);
  } catch (error) {
    console.error('Failed to create combined recorder:', error);
    // Stop stream tracks on error
    stream.getTracks().forEach(track => track.stop());
    recordingState.videoStream = null;
    isStarting = false;
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
    throw new Error(`Failed to initialize combined recorder: ${error.message}`);
  }

  // ========================================================================
  // DATA COLLECTION HANDLER
  // ========================================================================
  recordingState.videoRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordingState.videoChunks.push(event.data);
      console.log('Combined chunk recorded:', event.data.size, 'bytes');
    }
  };

  // ========================================================================
  // ERROR HANDLER
  // ========================================================================
  recordingState.videoRecorder.onerror = (event) => {
    console.error('Combined recorder error:', event.error);
    recordingState.isRecordingVideo = false;

    // Clean up on error
    if (recordingState.videoStream) {
      recordingState.videoStream.getTracks().forEach(track => track.stop());
      recordingState.videoStream = null;
    }
  };

  // ========================================================================
  // START RECORDING
  // ========================================================================
  try {
    // Check MediaRecorder state before starting
    if (recordingState.videoRecorder.state !== 'inactive') {
      console.warn('Combined recorder not in inactive state, current state:', recordingState.videoRecorder.state);
      throw new Error(`Cannot start recording: MediaRecorder is in ${recordingState.videoRecorder.state} state`);
    }

    console.log('Starting combined recorder with 1-second time slices...');
    recordingState.videoRecorder.start(1000);
    recordingState.isRecordingVideo = true;

    console.log('Combined recording started successfully, state:', recordingState.videoRecorder.state);
  } catch (error) {
    console.error('Failed to start combined recording:', error);

    // Clean up on error
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

// ============================================================================
// VIDEO RECORDING FUNCTION (LEGACY)
// ============================================================================

/**
 * Start video recording with a media stream
 *
 * This function:
 * 1. Detects the best supported video codec
 * 2. Creates a MediaRecorder instance
 * 3. Sets up event handlers for data collection
 * 4. Starts recording
 *
 * @param {MediaStream} stream - The media stream to record
 * @returns {Promise<void>}
 */
async function startVideoRecording(stream) {
  // ========================================================================
  // STATE VALIDATION AND CLEANUP
  // ========================================================================
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
    // Remove event handlers to prevent memory leaks
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
  
  // ========================================================================
  // CODEC SELECTION
  // ========================================================================
  // Determine the best supported codec for recording
  // Priority: VP9 > VP8 > WebM (fallback)
  // VP9 provides better compression and quality
  let options;
  if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
    options = { mimeType: 'video/webm; codecs=vp9' };
  } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
    options = { mimeType: 'video/webm; codecs=vp8' };
  } else {
    // Fallback to basic WebM if codecs not supported
    options = { mimeType: 'video/webm' };
  }
  
  console.log('Using codec:', options.mimeType);
  
  // ========================================================================
  // MEDIARECORDER SETUP
  // ========================================================================
  // Create MediaRecorder instance with selected codec
  try {
    recordingState.videoRecorder = new MediaRecorder(stream, options);
    console.log('Video recorder created, state:', recordingState.videoRecorder.state);
  } catch (error) {
    console.error('Failed to create video recorder:', error);
    // Stop stream tracks on error
    stream.getTracks().forEach(track => track.stop());
    recordingState.videoStream = null;
    isStarting = false;
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
    throw new Error(`Failed to initialize video recorder: ${error.message}`);
  }
  
  // ========================================================================
  // DATA COLLECTION HANDLER
  // ========================================================================
  // Collect video chunks as they become available
  // This fires periodically (every 1000ms) during recording
  recordingState.videoRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordingState.videoChunks.push(event.data);
      console.log('Video chunk recorded:', event.data.size, 'bytes');
    }
  };
  
  // ========================================================================
  // ERROR HANDLER
  // ========================================================================
  // Handle MediaRecorder errors
  recordingState.videoRecorder.onerror = (event) => {
    console.error('Video recorder error:', event.error);
    recordingState.isRecordingVideo = false;
    
    // Clean up on error
    if (recordingState.videoStream) {
      recordingState.videoStream.getTracks().forEach(track => track.stop());
      recordingState.videoStream = null;
    }
  };
  
  // ========================================================================
  // START RECORDING
  // ========================================================================
  // Start recording with 1-second time slices
  try {
    // Check MediaRecorder state before starting
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
    
    // Clean up on error
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (recordingState.videoRecorder) {
      // Clean up MediaRecorder instance
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

// ============================================================================
// MASTER RECORDING FUNCTIONS
// ============================================================================

/**
 * Generate a session ID for the recording session
 * Format: recording_YYYYMMDD_HHMMSS
 * 
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
 * Start all recording streams simultaneously
 *
 * This function:
 * 1. Generates a session ID
 * 2. Starts separate recordings for video, system audio, and microphone
 * 3. Each stream is recorded to its own file
 * 4. Updates UI to show active streams
 *
 * @param {MediaStream} videoStream - The video stream from screen capture (includes system audio)
 * @returns {Promise<void>}
 */
async function startAllRecordings(videoStream) {
  try {
    // Generate session ID
    recordingState.sessionId = generateSessionId();
    recordingState.startTime = Date.now();

    console.log('Starting separate recordings with session ID:', recordingState.sessionId);

    // Store the video stream
    recordingState.videoStream = videoStream;

    // Start video recording (screen capture)
    await startVideoRecording(videoStream);

    // Start system audio recording
    await startSystemAudioRecording();

    // Start microphone recording
    await startMicrophoneRecording();

    // Update UI to show which streams are active
    updateRecordingUI(recordingState);

    // Re-enable button after successful start
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }

    isStarting = false;

    // Recording functionality has been moved to chat-window.js

    // Log which streams are active
    const activeStreams = [];
    if (recordingState.isRecordingVideo) activeStreams.push('Video');
    if (recordingState.isRecordingSystemAudio) activeStreams.push('System Audio');
    if (recordingState.isRecordingMicrophone) activeStreams.push('Microphone');

    console.log('Recording started. Active streams:', activeStreams.join(' + '));

  } catch (error) {
    console.error('Failed to start recordings:', error);

    // Clean up any started streams
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
 *
 * Stops all MediaRecorders and collects their data,
 * then saves each stream to separate files.
 *
 * @returns {Promise<void>}
 */
async function stopAllRecordings() {
  console.log('Stop all recordings requested');

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

  // Wait for all recorders to stop
  await Promise.all(stopPromises);

  // Update UI immediately
  updateRecordingUI(recordingState);

  // Re-enable button
  if (recordingBtn) {
    recordingBtn.disabled = false;
  }

  // Collect data and save all recordings
  await saveAllRecordings();
}

/**
 * Save all recordings to separate files
 *
 * Collects the recorded chunks from each stream,
 * converts them to buffers, and sends to main process for saving.
 *
 * @returns {Promise<void>}
 */
async function saveAllRecordings() {
  try {
    console.log('Saving all recordings...');

    // Calculate duration
    const duration = recordingState.startTime
      ? Math.round((Date.now() - recordingState.startTime) / 1000)
      : 0;

    // Prepare data for each stream
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

    // Send all buffers to main process for saving
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
    // Clean up all state
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

  // Clean up recorders (only the combined recorder now)
  if (recordingState.videoRecorder) {
    recordingState.videoRecorder.ondataavailable = null;
    recordingState.videoRecorder.onstop = null;
    recordingState.videoRecorder.onerror = null;
    recordingState.videoRecorder = null;
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
 * Stop the current recording (legacy function name - redirects to stopAllRecordings)
 * 
 * @returns {Promise<void>}
 */
async function stopRecording() {
  return stopAllRecordings();
}

// ============================================================================
// UI MANAGEMENT
// ============================================================================

/**
 * Update UI elements based on recording state
 *
 * Changes button appearance, icon, and indicator visibility
 * to reflect which streams are currently recording.
 *
 * @param {Object} state - The recordingState object
 */
function updateRecordingUI(state) {
  if (!recordingBtn || !recordIcon || !recordingIndicator) {
    return;
  }

  const isRecording = state && (state.isRecordingVideo || state.isRecordingSystemAudio || state.isRecordingMicrophone);

  if (isRecording) {
    // Recording active state
    recordingBtn.classList.add('recording');
    recordingBtn.setAttribute('title', 'Stop Recording');
    // Change icon to stop square
    recordIcon.innerHTML = '<rect x="8" y="8" width="8" height="8" stroke-width="0" fill="currentColor"/>';
    recordingIndicator.classList.remove('hidden');

    // Update indicator text to show active streams
    const activeStreams = [];
    if (state.isRecordingVideo) activeStreams.push('Video');
    if (state.isRecordingSystemAudio) activeStreams.push('System Audio');
    if (state.isRecordingMicrophone) activeStreams.push('Microphone');

    const indicatorText = recordingIndicator.querySelector('span:not(.recording-pulse)');
    if (indicatorText) {
      indicatorText.textContent = `Recording (${activeStreams.join(' + ')})...`;
    }
  } else {
    // Recording inactive state - reset to initial state
    recordingBtn.classList.remove('recording');
    recordingBtn.setAttribute('title', 'Start Recording');
    // Change icon back to record circle
    recordIcon.innerHTML = '<circle cx="12" cy="12" r="6" fill="currentColor"/>';
    recordingIndicator.classList.add('hidden');
  }
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

/**
 * Show a notification to the user
 * 
 * Creates a temporary notification element that appears in the top-right
 * corner of the screen. Automatically removes itself after 5 seconds.
 * 
 * @param {string} title - Notification title
 * @param {string} message - Notification message/content
 */
function showNotification(title, message) {
  // Create notification element
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
  
  // Set notification content
  notification.innerHTML = `
    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 13px; color: #6b7280; word-break: break-all;">${message}</div>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Add animation keyframes if not already present
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
  
  // Auto-remove after 5 seconds with fade-out animation
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
// CLEANUP
// ============================================================================

/**
 * Clean up resources and event listeners
 * 
 * Should be called when the module is no longer needed
 * (e.g., when navigating away from the page)
 */
function cleanup() {
  // Stop all recordings if active
  if (isAnyRecording()) {
    try {
      stopAllRecordings();
    } catch (error) {
      console.error('Error stopping recording during cleanup:', error);
    }
  }
  
  // Remove IPC event listeners
  cleanupListeners.forEach(cleanup => {
    try {
      cleanup();
    } catch (error) {
      console.error('Error cleaning up listener:', error);
    }
  });
  cleanupListeners = [];
  
  // Reset state
  cleanupRecordingState();
}

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRecording);
} else {
  // DOM already loaded
  initializeRecording();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
