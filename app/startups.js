/**
 * Startups Management Module
 * Handles all startups-related operations and UI
 */

let startupsData = [];

/**
 * Load all startups from backend
 */
async function loadStartups() {
    try {
        const response = await window.backend.startups.fetchAll();
        // Handle both {success: true, data: [...]} and {status: 'success', data: [...]}
        if (response && response.success && Array.isArray(response.data)) {
            startupsData = response.data;
            renderStartups();
            updateStartupsInfo();
            return startupsData;
        } else if (response && response.status === 'success' && Array.isArray(response.data)) {
            startupsData = response.data;
            renderStartups();
            updateStartupsInfo();
            return startupsData;
        } else if (Array.isArray(response)) {
            // Handle case where backend returns array directly
            startupsData = response;
            renderStartups();
            updateStartupsInfo();
            return startupsData;
        } else if (Array.isArray(response.data)) {
            // Handle case where response has data property
            startupsData = response.data;
            renderStartups();
            updateStartupsInfo();
            return startupsData;
        } else {
            console.warn('Unexpected response format:', response);
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading startups:', error);
        showNotification('Failed to load startups: ' + error.message, 'error');
        startupsData = [];
        renderStartups();
        return [];
    }
}

/**
 * Load a single startup by ID
 */
async function loadStartupById(id) {
    try {
        const response = await window.backend.startups.fetchById(id);
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
            throw new Error('Startup not found');
        }
    } catch (error) {
        console.error('Error loading startup:', error);
        showNotification('Failed to load startup: ' + error.message, 'error');
        return null;
    }
}

/**
 * Create a new startup
 */
async function createStartup(data) {
    try {
        const response = await window.backend.startups.create(data);
        if (response && response.status === 'success') {
            showNotification('Startup created successfully', 'success');
            await loadStartups(); // Refresh list
            return response.data || response;
        } else if (response && response.id) {
            showNotification('Startup created successfully', 'success');
            await loadStartups(); // Refresh list
            return response;
        } else {
            throw new Error('Failed to create startup');
        }
    } catch (error) {
        console.error('Error creating startup:', error);
        showNotification('Failed to create startup: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Update a startup
 */
async function updateStartup(id, data) {
    try {
        const response = await window.backend.startups.update(id, data);
        if (response && response.status === 'success') {
            showNotification('Startup updated successfully', 'success');
            await loadStartups(); // Refresh list
            return response.data || response;
        } else {
            throw new Error('Failed to update startup');
        }
    } catch (error) {
        console.error('Error updating startup:', error);
        showNotification('Failed to update startup: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Delete a startup
 */
async function deleteStartup(id) {
    try {
        const response = await window.backend.startups.delete(id);
        if (response && response.status === 'success') {
            showNotification('Startup deleted successfully', 'success');
            await loadStartups(); // Refresh list
            return true;
        } else {
            throw new Error('Failed to delete startup');
        }
    } catch (error) {
        console.error('Error deleting startup:', error);
        showNotification('Failed to delete startup: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Render startups in the table
 */
function renderStartups() {
    const tbody = document.getElementById('startupsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (startupsData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center; padding: 24px; color: #6b7280;">No startups found</td>';
        tbody.appendChild(row);
        return;
    }

    startupsData.forEach(startup => {
        const row = document.createElement('tr');
        row.className = 'startup-table-row';
        
        const dateAccepted = startup.dateAccepted ? new Date(startup.dateAccepted).toLocaleDateString() : 'N/A';
        const applicationId = startup.applicationId || startup.application_id || 'N/A';

        row.innerHTML = `
            <td class="px-4 py-3">${startup.companyName || startup.company_name || 'N/A'}</td>
            <td class="px-4 py-3">${dateAccepted}</td>
            <td class="px-4 py-3">${applicationId}</td>
            <td class="px-4 py-3">
                <button class="btn-view-startup" data-startup-id="${startup.id}" title="View Details">
                    View
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Add event listeners for view buttons
    document.querySelectorAll('.btn-view-startup').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const startupId = e.target.getAttribute('data-startup-id');
            if (startupId) {
                // TODO: Implement startup detail view
                showNotification('Startup detail view coming soon', 'info');
            }
        });
    });
}

/**
 * Update startups info text
 */
function updateStartupsInfo() {
    const infoEl = document.getElementById('showingStartupsInfo');
    if (infoEl) {
        infoEl.textContent = `Showing ${startupsData.length} startup${startupsData.length !== 1 ? 's' : ''}`;
    }
}

/**
 * Initialize startups module
 */
function initStartups() {
    // Load startups on init
    loadStartups();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStartups);
} else {
    initStartups();
}

