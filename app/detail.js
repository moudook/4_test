// Detail page functionality
// Get startup ID from localStorage
const startupId = localStorage.getItem('selectedStartupId');
let startup = null;
let isLoadingStartup = false;

// Initialize detail data storage
function getDetailData() {
    const storedData = localStorage.getItem('startupDetails');
    if (storedData) {
        return JSON.parse(storedData);
    }
    return {};
}

function saveDetailData(id, section, value) {
    const allData = getDetailData();
    if (!allData[id]) {
        allData[id] = {};
    }
    allData[id][section] = value;
    localStorage.setItem('startupDetails', JSON.stringify(allData));
}

function loadDetailData(id) {
    const allData = getDetailData();
    return allData[id] || {};
}

// DOM elements
const elements = {
    homeBtn: document.getElementById('homeBtn'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    startupNotes: document.getElementById('startupNotes'),
    founderNotes: document.getElementById('founderNotes'),
    legalDueDiligence: document.getElementById('legalDueDiligence'),
    techDueDiligence: document.getElementById('techDueDiligence'),
    customerDueDiligence: document.getElementById('customerDueDiligence'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content')
};

// Track unsaved changes
let hasUnsavedChanges = false;
let originalValues = {};
let editMode = {}; // Track edit mode per tab: { 'startupNotes': true, ... }

// Tab switching functionality
function setupTabs() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Check if current tab is in edit mode
            const currentActiveTab = Array.from(elements.tabBtns).find(b => b.classList.contains('active'));
            const currentTabKey = currentActiveTab ? currentActiveTab.dataset.tab : null;
            
            if (currentTabKey && editMode[currentTabKey]) {
                // Block tab switching - show warning
                showNotification('You have unsaved changes. Save or Cancel before navigating.');
                return;
            }
            
            // Allow tab switching if not in edit mode
            switchToTab(targetTab);
        });
    });
}

// Switch to a specific tab
function switchToTab(targetTab) {
    // Remove active class from all tabs and contents
    elements.tabBtns.forEach(b => b.classList.remove('active'));
    elements.tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    const clickedBtn = Array.from(elements.tabBtns).find(btn => btn.dataset.tab === targetTab);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    const targetContent = document.getElementById(`tab-${targetTab}`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

// Load startup information from backend
async function loadStartupInfo() {
    if (!startupId) {
        showNotification('No startup selected. Returning to main page...');
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 2000);
        return;
    }

    isLoadingStartup = true;
    showNotification('Loading startup details...');

    try {
        // Fetch application data from backend
        const result = await window.backend.applications.fetchById(startupId);
        
        if (result.success && result.data) {
            startup = result.data;
            
            // Load saved detail data (for notes fields that may not be in backend)
            const detailData = loadDetailData(startupId);
    
            // Extract notes from dueDiligenceSummary if available
            let dueDiligenceData = {};
            if (startup.notes && startup.notes !== '-') {
                try {
                    dueDiligenceData = JSON.parse(startup.notes);
                } catch (e) {
                    // If not JSON, treat as plain text
                    dueDiligenceData = { notes: startup.notes };
                }
            }
            
            const startupNotesValue = detailData.startupNotes || dueDiligenceData.startupNotes || '';
            const founderNotesValue = detailData.founderNotes || dueDiligenceData.founderNotes || '';
            const legalDueDiligenceValue = detailData.legalDueDiligence || dueDiligenceData.legalDueDiligence || '';
            const techDueDiligenceValue = detailData.techDueDiligence || dueDiligenceData.techDueDiligence || '';
            const customerDueDiligenceValue = detailData.customerDueDiligence || dueDiligenceData.customerDueDiligence || '';
            
            // Set values and store originals
            if (elements.startupNotes) {
                elements.startupNotes.value = startupNotesValue;
                originalValues.startupNotes = startupNotesValue;
            }
            if (elements.founderNotes) {
                elements.founderNotes.value = founderNotesValue;
                originalValues.founderNotes = founderNotesValue;
            }
            if (elements.legalDueDiligence) {
                elements.legalDueDiligence.value = legalDueDiligenceValue;
                originalValues.legalDueDiligence = legalDueDiligenceValue;
            }
            if (elements.techDueDiligence) {
                elements.techDueDiligence.value = techDueDiligenceValue;
                originalValues.techDueDiligence = techDueDiligenceValue;
            }
            if (elements.customerDueDiligence) {
                elements.customerDueDiligence.value = customerDueDiligenceValue;
                originalValues.customerDueDiligence = customerDueDiligenceValue;
            }
            
            hasUnsavedChanges = false;
            showNotification('Startup details loaded successfully.');
        } else {
            showNotification('Startup not found. Returning to main page...');
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 2000);
            return;
        }
    } catch (error) {
        showNotification(`Error loading startup: ${error.message}. Returning to main page...`);
        console.error('Error loading startup:', error);
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 2000);
        return;
    } finally {
        isLoadingStartup = false;
    }
}

// Get button container for a field
function getButtonContainer(key) {
    const saveBtn = document.getElementById(`save${key.charAt(0).toUpperCase() + key.slice(1)}`);
    return saveBtn ? saveBtn.closest('.save-cancel-buttons') : null;
}

// Enter edit mode for a field
function enterEditMode(key) {
    editMode[key] = true;
    const buttonContainer = getButtonContainer(key);
    if (buttonContainer) {
        buttonContainer.style.display = 'flex';
    }
}

// Exit edit mode for a field
function exitEditMode(key) {
    editMode[key] = false;
    const buttonContainer = getButtonContainer(key);
    if (buttonContainer) {
        buttonContainer.style.display = 'none';
    }
}

// Track changes instead of auto-save
function setupChangeTracking() {
    const textareas = [
        { element: elements.startupNotes, key: 'startupNotes', saveBtn: document.getElementById('saveStartupNotes') },
        { element: elements.founderNotes, key: 'founderNotes', saveBtn: document.getElementById('saveFounderNotes') },
        { element: elements.legalDueDiligence, key: 'legalDueDiligence', saveBtn: document.getElementById('saveLegalDueDiligence') },
        { element: elements.techDueDiligence, key: 'techDueDiligence', saveBtn: document.getElementById('saveTechDueDiligence') },
        { element: elements.customerDueDiligence, key: 'customerDueDiligence', saveBtn: document.getElementById('saveCustomerDueDiligence') }
    ];

    textareas.forEach(({ element, key, saveBtn }) => {
        if (element) {
            // Helper function to normalize empty values for comparison
            const normalizeValue = (val) => {
                return (val || '').trim();
            };
            
            // Helper function to check if values are effectively the same
            const isSameValue = (val1, val2) => {
                return normalizeValue(val1) === normalizeValue(val2);
            };
            
            element.addEventListener('input', () => {
                // Get normalized values for comparison
                const currentValue = normalizeValue(element.value);
                const originalValue = normalizeValue(originalValues[key] || '');
                
                // Check if value has actually changed from original
                const hasChanged = currentValue !== originalValue;
                
                if (hasChanged) {
                    hasUnsavedChanges = true;
                    // Enter edit mode and show save/cancel buttons
                    enterEditMode(key);
                } else {
                    // Exit edit mode if back to original (including empty)
                    exitEditMode(key);
                    // Check if all fields match originals
                    checkAllChanges();
                }
            });
            
            // Add click handler to save button
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    saveSingleField(key, element);
                });
            }
            
            // Add click handler to cancel button
            const cancelBtn = document.getElementById(`cancel${key.charAt(0).toUpperCase() + key.slice(1)}`);
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    cancelSingleField(key, element);
                });
            }
        }
    });
}

// Save a single field
async function saveSingleField(key, element) {
    isLoadingStartup = true;
    
    try {
        // Get current due diligence data
        const detailData = loadDetailData(startupId);
        let dueDiligenceData = {};
        
        // Try to parse existing notes if available
        if (startup && startup.notes && startup.notes !== '-') {
            try {
                dueDiligenceData = JSON.parse(startup.notes);
            } catch (e) {
                dueDiligenceData = {};
            }
        }
        
        // Update the specific field
        dueDiligenceData[key] = element.value;
        
        // Also save to localStorage for local backup
        saveDetailData(startupId, key, element.value);
        
        // Update backend
        const updateData = {
            notes: JSON.stringify(dueDiligenceData)
        };
        
        const result = await window.backend.applications.update(startupId, updateData);
        
        if (result.success) {
            // Update original value
            originalValues[key] = element.value;
            
            // Exit edit mode (hides save/cancel buttons)
            exitEditMode(key);
            
            // Update hasUnsavedChanges flag
            checkAllChanges();
            
            // Show notification
            showNotification(`${getFieldDisplayName(key)} saved successfully.`);
        } else {
            showNotification(`Error saving ${getFieldDisplayName(key)}: ${result.error}`);
        }
    } catch (error) {
        showNotification(`Error saving ${getFieldDisplayName(key)}: ${error.message}`);
        console.error('Error saving field:', error);
    } finally {
        isLoadingStartup = false;
    }
}

// Cancel a single field (discard changes)
function cancelSingleField(key, element) {
    // Restore original value
    element.value = originalValues[key] || '';
    
    // Exit edit mode (hides save/cancel buttons)
    exitEditMode(key);
    
    // Update hasUnsavedChanges flag
    checkAllChanges();
    
    // Show notification
    showNotification(`${getFieldDisplayName(key)} changes discarded.`);
}

// Get display name for field
function getFieldDisplayName(key) {
    const names = {
        'startupNotes': 'Startup Notes',
        'founderNotes': 'Founder Notes',
        'legalDueDiligence': 'Legal Diligence',
        'techDueDiligence': 'Tech Diligence',
        'customerDueDiligence': 'Customer Diligence'
    };
    return names[key] || key;
}

// Helper function to normalize empty values for comparison
function normalizeValue(val) {
    return (val || '').trim();
}

// Helper function to check if values are effectively the same
function isSameValue(val1, val2) {
    return normalizeValue(val1) === normalizeValue(val2);
}

// Check if there are any unsaved changes
function checkAllChanges() {
    const textareas = [
        { element: elements.startupNotes, key: 'startupNotes' },
        { element: elements.founderNotes, key: 'founderNotes' },
        { element: elements.legalDueDiligence, key: 'legalDueDiligence' },
        { element: elements.techDueDiligence, key: 'techDueDiligence' },
        { element: elements.customerDueDiligence, key: 'customerDueDiligence' }
    ];
    
    hasUnsavedChanges = false;
    
    textareas.forEach(({ element, key }) => {
        if (element) {
            // Get normalized values for comparison
            const currentValue = normalizeValue(element.value);
            const originalValue = normalizeValue(originalValues[key] || '');
            
            const hasChanged = currentValue !== originalValue;
            if (hasChanged) {
                hasUnsavedChanges = true;
                // Enter edit mode if changed
                enterEditMode(key);
            } else {
                // Exit edit mode if back to original (including empty)
                exitEditMode(key);
            }
        }
    });
}

// Save all changes
async function saveAllChanges() {
    isLoadingStartup = true;
    
    try {
        const textareas = [
            { element: elements.startupNotes, key: 'startupNotes' },
            { element: elements.founderNotes, key: 'founderNotes' },
            { element: elements.legalDueDiligence, key: 'legalDueDiligence' },
            { element: elements.techDueDiligence, key: 'techDueDiligence' },
            { element: elements.customerDueDiligence, key: 'customerDueDiligence' }
        ];
        
        // Build due diligence data object
        const dueDiligenceData = {};
        textareas.forEach(({ element, key }) => {
            if (element) {
                dueDiligenceData[key] = element.value;
                // Also save to localStorage for local backup
                saveDetailData(startupId, key, element.value);
            }
        });
        
        // Update backend
        const updateData = {
            notes: JSON.stringify(dueDiligenceData)
        };
        
        const result = await window.backend.applications.update(startupId, updateData);
        
        if (result.success) {
            textareas.forEach(({ element, key }) => {
                if (element) {
                    originalValues[key] = element.value;
                    // Exit edit mode (hides save/cancel buttons)
                    exitEditMode(key);
                }
            });
            
            hasUnsavedChanges = false;
            showNotification('All changes saved successfully');
        } else {
            showNotification(`Error saving changes: ${result.error}`);
        }
    } catch (error) {
        showNotification(`Error saving changes: ${error.message}`);
        console.error('Error saving all changes:', error);
    } finally {
        isLoadingStartup = false;
    }
}

// Revert all changes to original values
function revertAllChanges() {
    const textareas = [
        { element: elements.startupNotes, key: 'startupNotes' },
        { element: elements.founderNotes, key: 'founderNotes' },
        { element: elements.legalDueDiligence, key: 'legalDueDiligence' },
        { element: elements.techDueDiligence, key: 'techDueDiligence' },
        { element: elements.customerDueDiligence, key: 'customerDueDiligence' }
    ];
    
    textareas.forEach(({ element, key }) => {
        if (element) {
            element.value = originalValues[key] || '';
            // Exit edit mode (hides save/cancel buttons)
            exitEditMode(key);
        }
    });
    
    hasUnsavedChanges = false;
    showNotification('Changes reverted to original');
}

// Flash save buttons red when there are unsaved changes
function flashSaveButtons() {
    const buttonContainers = [
        getButtonContainer('startupNotes'),
        getButtonContainer('founderNotes'),
        getButtonContainer('legalDueDiligence'),
        getButtonContainer('techDueDiligence'),
        getButtonContainer('customerDueDiligence')
    ];
    
    // Filter to only visible button containers (those in edit mode)
    const visibleContainers = buttonContainers.filter(container => {
        return container && container.style.display !== 'none';
    });
    
    if (visibleContainers.length === 0) {
        return; // No visible save buttons to flash
    }
    
    // Get save buttons from visible containers
    const visibleSaveButtons = visibleContainers
        .map(container => container.querySelector('.save-field-btn'))
        .filter(btn => btn !== null);
    
    // Add red flash class to all visible save buttons
    visibleSaveButtons.forEach(btn => {
        btn.classList.add('flash-red');
    });
    
    // Remove the red flash class after 2 seconds
    setTimeout(() => {
        visibleSaveButtons.forEach(btn => {
            btn.classList.remove('flash-red');
        });
    }, 2000);
}

// Home button functionality - check for unsaved changes and flash save buttons if needed
elements.homeBtn.addEventListener('click', (e) => {
    checkAllChanges();
    if (hasUnsavedChanges) {
        // Flash save buttons red
        flashSaveButtons();
        // Prevent immediate navigation to show the flash
        e.preventDefault();
        // Navigate after a brief delay to ensure flash is visible
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 500);
    } else {
        window.location.href = 'main.html';
    }
});

// Handle page unload (browser back button, close tab, etc.) - keep browser warning
window.addEventListener('beforeunload', (e) => {
    checkAllChanges();
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Some browsers require this
        return '';
    }
});

// Notification system
function showNotification(message) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 2000);
}

// Initialize the page
setupTabs();
loadStartupInfo();
setupChangeTracking();
