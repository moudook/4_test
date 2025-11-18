/**
 * Meetings Management Module
 * Handles all meetings-related operations and UI
 */

let meetingsData = [];
let currentMeetingWebSocket = null;

/**
 * Load all meetings from backend
 */
async function loadMeetings() {
    try {
        const response = await window.backend.meetings.fetchAll();
        // Handle both {success: true, data: [...]} and {status: 'success', data: [...]}
        if (response && response.success && Array.isArray(response.data)) {
            meetingsData = response.data;
            renderMeetings();
            updateMeetingsInfo();
            return meetingsData;
        } else if (response && response.status === 'success' && Array.isArray(response.data)) {
            meetingsData = response.data;
            renderMeetings();
            updateMeetingsInfo();
            return meetingsData;
        } else if (Array.isArray(response)) {
            // Handle case where backend returns array directly
            meetingsData = response;
            renderMeetings();
            updateMeetingsInfo();
            return meetingsData;
        } else if (Array.isArray(response.data)) {
            // Handle case where response has data property
            meetingsData = response.data;
            renderMeetings();
            updateMeetingsInfo();
            return meetingsData;
        } else {
            console.warn('Unexpected response format:', response);
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading meetings:', error);
        showNotification('Failed to load meetings: ' + error.message, 'error');
        meetingsData = [];
        renderMeetings();
        return [];
    }
}

/**
 * Load a single meeting by ID
 */
async function loadMeetingById(id) {
    try {
        const response = await window.backend.meetings.fetchById(id);
        // Handle multiple response formats
        if (response && response.success && response.data) {
            return response.data;
        } else if (response && response.status === 'success' && response.data) {
            return response.data;
        } else if (response && response.id) {
            // Direct data object
            return response;
        } else if (response && response.data && response.data.id) {
            return response.data;
        } else {
            throw new Error('Meeting not found');
        }
    } catch (error) {
        console.error('Error loading meeting:', error);
        showNotification('Failed to load meeting: ' + error.message, 'error');
        return null;
    }
}

/**
 * Load meetings by VC ID
 */
async function loadMeetingsByVc(vcId) {
    try {
        const response = await window.backend.meetings.fetchByVc(vcId);
        // Handle multiple response formats
        if (response && response.success && Array.isArray(response.data)) {
            return response.data;
        } else if (response && response.status === 'success' && Array.isArray(response.data)) {
            return response.data;
        } else if (Array.isArray(response)) {
            return response;
        } else if (Array.isArray(response.data)) {
            return response.data;
        } else {
            console.warn('Unexpected response format:', response);
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading meetings by VC:', error);
        showNotification('Failed to load meetings: ' + error.message, 'error');
        return [];
    }
}

/**
 * Create a new meeting
 */
async function createMeeting(vcId) {
    try {
        const response = await window.backend.meetings.create({ vc_id: vcId });
        if (response && response.status === 'success') {
            const meeting = response.data || response;
            showNotification('Meeting created successfully', 'success');
            await loadMeetings(); // Refresh list
            return meeting;
        } else if (response && response.id) {
            showNotification('Meeting created successfully', 'success');
            await loadMeetings(); // Refresh list
            return response;
        } else {
            throw new Error('Failed to create meeting');
        }
    } catch (error) {
        console.error('Error creating meeting:', error);
        showNotification('Failed to create meeting: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Update a meeting
 */
async function updateMeeting(meetingData) {
    try {
        const response = await window.backend.meetings.update(meetingData);
        if (response && response.status === 'success') {
            showNotification('Meeting updated successfully', 'success');
            await loadMeetings(); // Refresh list
            return response.data || response;
        } else {
            throw new Error('Failed to update meeting');
        }
    } catch (error) {
        console.error('Error updating meeting:', error);
        showNotification('Failed to update meeting: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Delete a meeting
 */
async function deleteMeeting(id) {
    try {
        const response = await window.backend.meetings.delete(id);
        if (response && response.status === 'success') {
            showNotification('Meeting deleted successfully', 'success');
            await loadMeetings(); // Refresh list
            return true;
        } else {
            throw new Error('Failed to delete meeting');
        }
    } catch (error) {
        console.error('Error deleting meeting:', error);
        showNotification('Failed to delete meeting: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Render meetings in the table
 */
function renderMeetings() {
    const tbody = document.getElementById('meetingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (meetingsData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center; padding: 24px; color: #6b7280;">No meetings found</td>';
        tbody.appendChild(row);
        return;
    }

    meetingsData.forEach(meeting => {
        const row = document.createElement('tr');
        row.className = 'startup-table-row';
        
        const startTime = meeting.start_time ? new Date(meeting.start_time).toLocaleString() : 'N/A';
        const endTime = meeting.end_time ? new Date(meeting.end_time).toLocaleString() : 'N/A';
        const status = meeting.status || 'unknown';

        row.innerHTML = `
            <td class="px-4 py-3">${meeting.id || 'N/A'}</td>
            <td class="px-4 py-3">${meeting.vc_id || 'N/A'}</td>
            <td class="px-4 py-3">${startTime}</td>
            <td class="px-4 py-3">${endTime}</td>
            <td class="px-4 py-3">
                <span class="status-badge ${status.toLowerCase()}">${status}</span>
            </td>
            <td class="px-4 py-3">
                <button class="btn-view-meeting" data-meeting-id="${meeting.id}" title="View Details">
                    View
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Add event listeners for view buttons
    document.querySelectorAll('.btn-view-meeting').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const meetingId = e.target.getAttribute('data-meeting-id');
            if (meetingId) {
                showMeetingDetail(meetingId);
            }
        });
    });
}

/**
 * Update meetings info text
 */
function updateMeetingsInfo() {
    const infoEl = document.getElementById('showingMeetingsInfo');
    if (infoEl) {
        infoEl.textContent = `Showing ${meetingsData.length} meeting${meetingsData.length !== 1 ? 's' : ''}`;
    }
}

/**
 * Show meeting detail modal
 */
async function showMeetingDetail(meetingId) {
    const modal = document.getElementById('meetingDetailModal');
    const content = document.getElementById('meetingDetailContent');
    
    if (!modal || !content) return;

    // Show loading state
    content.innerHTML = '<div style="text-align: center; padding: 24px;"><div class="loading-spinner"></div><p>Loading meeting details...</p></div>';
    modal.style.display = 'block';

    try {
        const meeting = await loadMeetingById(meetingId);
        if (!meeting) {
            content.innerHTML = '<p style="color: #ef4444;">Failed to load meeting details.</p>';
            return;
        }

        // Format meeting details
        const startTime = meeting.start_time ? new Date(meeting.start_time).toLocaleString() : 'N/A';
        const endTime = meeting.end_time ? new Date(meeting.end_time).toLocaleString() : 'N/A';
        const status = meeting.status || 'unknown';

        let html = `
            <div class="meeting-detail-section">
                <h3>Meeting Information</h3>
                <div class="meeting-detail-item">
                    <span class="meeting-detail-label">Meeting ID:</span>
                    <span class="meeting-detail-value">${meeting.id || 'N/A'}</span>
                </div>
                <div class="meeting-detail-item">
                    <span class="meeting-detail-label">VC ID:</span>
                    <span class="meeting-detail-value">${meeting.vc_id || 'N/A'}</span>
                </div>
                <div class="meeting-detail-item">
                    <span class="meeting-detail-label">Start Time:</span>
                    <span class="meeting-detail-value">${startTime}</span>
                </div>
                <div class="meeting-detail-item">
                    <span class="meeting-detail-label">End Time:</span>
                    <span class="meeting-detail-value">${endTime}</span>
                </div>
                <div class="meeting-detail-item">
                    <span class="meeting-detail-label">Status:</span>
                    <span class="meeting-detail-value">
                        <span class="status-badge ${status.toLowerCase()}">${status}</span>
                    </span>
                </div>
        `;

        // Add transcript chunks if available
        if (meeting.transcript_chunks && meeting.transcript_chunks.length > 0) {
            html += `
                <div class="meeting-detail-section">
                    <h3>Transcript</h3>
            `;
            meeting.transcript_chunks.forEach(chunk => {
                const chunkTime = chunk.timestamp ? new Date(chunk.timestamp).toLocaleTimeString() : 'N/A';
                html += `
                    <div class="transcript-chunk">
                        <div class="transcript-chunk-time">${chunkTime}</div>
                        <div class="transcript-chunk-text">${chunk.text || chunk.transcript || 'N/A'}</div>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Add summary if available
        if (meeting.summary) {
            html += `
                <div class="meeting-detail-section">
                    <h3>Summary</h3>
                    <p>${meeting.summary}</p>
                </div>
            `;
        }

        // Add VC notes if available
        if (meeting.vc_notes) {
            html += `
                <div class="meeting-detail-section">
                    <h3>VC Notes</h3>
                    <p>${meeting.vc_notes}</p>
                </div>
            `;
        }

        html += '</div>';
        content.innerHTML = html;

    } catch (error) {
        content.innerHTML = `<p style="color: #ef4444;">Error loading meeting details: ${error.message}</p>`;
    }
}

/**
 * Initialize meetings module
 */
function initMeetings() {
    // Load meetings on init
    loadMeetings();

    // Set up create meeting modal handlers
    const createBtn = document.getElementById('createMeetingBtn');
    const createModal = document.getElementById('createMeetingModal');
    const closeCreateModal = document.getElementById('closeCreateMeetingModal');
    const cancelCreateBtn = document.getElementById('cancelCreateMeetingBtn');
    const saveCreateBtn = document.getElementById('saveCreateMeetingBtn');
    const vcIdInput = document.getElementById('createMeetingVcId');

    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (createModal) {
                createModal.style.display = 'block';
                if (vcIdInput) vcIdInput.focus();
            }
        });
    }

    const closeCreateModalHandler = () => {
        if (createModal) {
            createModal.style.display = 'none';
            if (vcIdInput) vcIdInput.value = '';
        }
    };

    if (closeCreateModal) {
        closeCreateModal.addEventListener('click', closeCreateModalHandler);
    }

    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', closeCreateModalHandler);
    }

    if (saveCreateBtn) {
        saveCreateBtn.addEventListener('click', async () => {
            const vcId = vcIdInput ? vcIdInput.value.trim() : '';
            if (!vcId) {
                showNotification('Please enter a VC ID', 'warning');
                return;
            }

            saveCreateBtn.disabled = true;
            saveCreateBtn.textContent = 'Creating...';

            try {
                await createMeeting(vcId);
                closeCreateModalHandler();
            } catch (error) {
                // Error already shown in createMeeting
            } finally {
                saveCreateBtn.disabled = false;
                saveCreateBtn.textContent = 'Create Meeting';
            }
        });
    }

    // Set up meeting detail modal handlers
    const detailModal = document.getElementById('meetingDetailModal');
    const closeDetailModal = document.getElementById('closeMeetingDetailModal');
    const closeDetailBtn = document.getElementById('closeMeetingDetailBtn');

    const closeDetailModalHandler = () => {
        if (detailModal) {
            detailModal.style.display = 'none';
            if (currentMeetingWebSocket) {
                currentMeetingWebSocket.close();
                currentMeetingWebSocket = null;
            }
        }
    };

    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', closeDetailModalHandler);
    }

    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeDetailModalHandler);
    }

    // Close modal when clicking overlay
    if (detailModal) {
        const overlay = detailModal.querySelector('.edit-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeDetailModalHandler);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeetings);
} else {
    initMeetings();
}

