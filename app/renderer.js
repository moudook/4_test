// --- Table Functionality ---
// Loading state management
let isLoading = false;

// Helper function to show loading state
function setLoadingState(loading) {
    isLoading = loading;
    if (elements.tableBody) {
        if (loading) {
            elements.tableBody.innerHTML = '<tr><td colspan="20" style="text-align: center; padding: 2rem;"><div>Loading data...</div></td></tr>';
        }
    }
}

// Helper function to show error message
function showError(message) {
    showNotification(`Error: ${message}`);
    console.error(message);
}

// --- Table Functionality ---
// Helper function to generate sample data (kept as fallback)
function generateSampleData() {
    const companies = ["TechFlow Solutions", "GreenEnergy Labs", "HealthAI Diagnostics", "FinSecure Systems", "EduNext Platform", 
                       "AI Innovations Inc", "CloudTech Solutions", "SecureVault", "GreenFarm Tech", "MediCare Plus", 
                       "FinFlow Analytics", "DataSync Corp", "BioTech Innovations", "CyberShield Inc", "EcoTech Ventures",
                       "MediCare Solutions", "FinTech Dynamics", "CloudSync Inc", "AI Vision Labs", "BlockChain Ventures"];
    const industries = ["SaaS", "CleanTech", "HealthTech", "FinTech", "EdTech", "AI/ML", "Cloud Computing", "Cybersecurity", 
                       "AgriTech", "Biotech", "Blockchain", "IoT", "Robotics", "Gaming", "E-commerce"];
    const locations = ["San Francisco, CA", "New York, NY", "Boston, MA", "Austin, TX", "Seattle, WA", "Chicago, IL", 
                      "Los Angeles, CA", "Denver, CO", "Atlanta, GA", "Miami, FL"];
    const founderNames = ["John Smith", "Sarah Johnson", "Michael Chen", "Emily Davis", "David Wilson", "Lisa Anderson",
                         "Robert Taylor", "Jennifer Martinez", "William Brown", "Jessica Garcia"];
    const rounds = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C"];
    const statuses = ["Source", "Qualification", "Intro Call", "Partner Intro", "Internal Fit Check", "Light Diligence",
                     "Deep Diligence", "Investment Committee", "Final Diligence", "Term Sheet", "Closing", "Onboarding",
                     "Portfolio Monitoring"];
    const dealLeads = ["Alice Cooper", "Bob Smith", "Carol White", "Dan Green", "Eva Blue"];
    const sources = ["Referral", "Cold Outreach", "Network", "Event", "Platform", "Partnership"];
    
    const summaries = [
        "Revolutionary AI-powered platform transforming healthcare diagnostics with real-time analysis and 95% accuracy rates.",
        "Leading sustainable energy solutions provider focusing on solar panel efficiency and smart grid technology.",
        "Next-generation fintech platform offering seamless payment processing and blockchain-based transactions.",
        "Innovative edtech platform providing personalized learning experiences for K-12 students with AI tutors.",
        "Cutting-edge cloud infrastructure company specializing in serverless computing and microservices architecture.",
        "Advanced cybersecurity solutions protecting enterprises from zero-day attacks with ML-powered threat detection.",
        "AgTech startup developing precision farming tools using IoT sensors and drone technology for crop optimization.",
        "Biotech firm pioneering gene therapy treatments for rare diseases with promising Phase 2 trial results.",
        "Blockchain infrastructure company building decentralized applications with enhanced scalability and security.",
        "IoT platform connecting millions of devices with real-time data analytics and predictive maintenance capabilities.",
        "Robotics company creating autonomous warehouse solutions that reduce operational costs by 40%.",
        "Gaming technology startup developing immersive VR experiences with cutting-edge graphics and AI NPCs.",
        "E-commerce platform leveraging AI for personalized shopping experiences and automated inventory management.",
        "SaaS solution streamlining project management with collaborative tools and automated workflow optimization.",
        "MedTech company developing non-invasive monitoring devices for chronic disease management.",
        "EdTech platform offering professional certification programs in emerging tech fields with industry partnerships.",
        "FinTech startup providing microloans to underserved communities with AI-based risk assessment.",
        "CleanTech company revolutionizing waste management with AI-powered recycling and circular economy solutions.",
        "HealthTech platform connecting patients with specialists through telehealth and AI diagnostics.",
        "Cybersecurity firm offering automated penetration testing and vulnerability assessment services."
    ];
    
    const notesArray = [
        "Met founder at TechCrunch Disrupt. Strong technical background. Previous exit at $50M. Open to strategic partnerships.",
        "Introduced through portfolio company CEO. Impressive traction: 10K+ users in 6 months. Looking for Series A lead.",
        "Referral from accelerator program. Team has deep domain expertise. Revenue growing 20% MoM. Follow up on terms.",
        "Cold outreach responded positively. Impressive demo showed strong product-market fit. Schedule deep dive meeting.",
        "Network connection from previous investment. Unique approach to market. Competitive advantage in pricing.",
        "Met at startup pitch event. Early stage but shows promise. Need to evaluate market size and competition.",
        "Portfolio company recommendation. Solving real pain point. Strong unit economics. Due diligence in progress.",
        "Founder reached out via LinkedIn. Interesting technology but early validation needed. Review technical feasibility.",
        "Event introduction at VCs conference. Rapid growth metrics. Strategic fit with our portfolio. Internal discussion ongoing.",
        "Platform application. Clear value proposition. Team has relevant experience. Initial screening passed.",
        "Referral from advisor network. Promising market opportunity. Need financial model review and customer references.",
        "Partnership opportunity arose. Potential synergies with existing investments. Evaluate strategic value.",
        "Follow-up on previous conversation. Progress made on key metrics. Ready for next funding round discussions.",
        "Network introduction through university alumni. Strong academic credentials. Technology needs validation.",
        "Cold outreach campaign response. Interesting business model. Schedule discovery call to understand more.",
        "Referral from industry expert. Impressive early customers include Fortune 500 companies. High priority.",
        "Event networking connection. Unique solution addressing regulatory compliance. Market timing looks good.",
        "Platform discovery. Strong founding team with complementary skills. Traction in underserved market.",
        "Partnership exploration. Mutual interest in collaboration. Discuss investment terms and strategic alignment.",
        "Previous interaction from accelerator. Significant progress since last touchpoint. Update metrics and growth."
    ];
    
    const keyInsights = [
        "Strong product-market fit evidenced by 150% NRR and negative churn. Market leader in vertical SaaS segment.",
        "Proprietary technology creates 12-month moat. Patents filed for core IP. Competitors struggling to match performance.",
        "Exceptional team with prior successful exits. Founder previously scaled company to $100M+ revenue.",
        "Large TAM ($5B+) with high growth rate. Early mover advantage in emerging market category.",
        "Strong unit economics: 85% gross margins, 6-month payback period. Scalable sales model.",
        "Strategic partnerships with industry leaders provide distribution channel. Signed LOIs with key customers.",
        "Regulatory tailwinds favor market entry. Policy changes create opportunity for disruption.",
        "Technology breakthrough solves critical industry pain point. Customer testimonials show 10x improvement.",
        "Defensible market position through network effects. User base growth compounds value proposition.",
        "Strong financial performance: $2M ARR, 300% YoY growth. Path to profitability in 18 months.",
        "Seasoned team with deep industry connections. Advisory board includes former industry executives.",
        "Unique go-to-market strategy reduces customer acquisition costs by 60% compared to industry average.",
        "Early traction with enterprise customers validates enterprise sales model. Multiple Fortune 500 pilots.",
        "Capital efficient model with low burn rate. Can reach profitability with $5M funding.",
        "Technology platform enables marketplace model with high take rates. Network effects strengthen over time.",
        "Strong customer retention (95%+) indicates sticky product. Expansion revenue growing 40% QoQ.",
        "Strategic location provides access to talent pool. Low cost structure relative to competitors.",
        "Clear path to scale with proven playbook. Team has experience scaling similar businesses.",
        "Market consolidation opportunity. Fragmented industry ripe for platform play.",
        "Innovative business model creates multiple revenue streams. Diversification reduces risk."
    ];
    
    const nextActions = [
        "Schedule follow-up call with founder",
        "Review pitch deck and financial model",
        "Conduct reference calls with customers",
        "Deep dive on technical architecture",
        "Meet with other investors for syndicate",
        "Request updated financial statements",
        "Perform competitive analysis",
        "Schedule meeting with advisors",
        "Review term sheet draft",
        "Prepare investment committee presentation",
        "Due diligence kickoff meeting",
        "Customer interview scheduling",
        "Technical due diligence with CTO",
        "Legal review of contracts",
        "Market research and validation",
        "Portfolio company introduction",
        "Strategic partnership discussion",
        "Attend product demo session",
        "Industry expert consultation",
        "Finalize investment decision"
    ];
    
    const data = [];
    for (let i = 1; i <= 100; i++) {
        const company = companies[i % companies.length] + (i > companies.length ? ` ${Math.floor(i / companies.length)}` : '');
        const industry = industries[i % industries.length];
        const location = locations[i % locations.length];
        const founderName = founderNames[i % founderNames.length];
        const founderContact = `founder${i}@${company.toLowerCase().replace(/\s+/g, '')}.com`;
        const round = rounds[i % rounds.length];
        const amounts = ["$500K", "$1M", "$1.8M", "$2.5M", "$5M", "$8M", "$12M", "$15M", "$18M", "$22M"];
        const amount = amounts[i % amounts.length];
        const valuations = ["$2M", "$5M", "$8M", "$15M", "$25M", "$42M", "$65M", "$85M", "$110M", "$150M"];
        const valuation = valuations[i % valuations.length];
        const status = statuses[i % statuses.length];
        const dealLead = dealLeads[i % dealLeads.length];
        const dateAdded = new Date(2024, 0, 1 + (i % 365)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const source = sources[i % sources.length];
        const summary = summaries[i % summaries.length];
        const notes = notesArray[i % notesArray.length];
        const companySlug = company.toLowerCase().replace(/\s+/g, '');
        const deckLink = `https://docs.google.com/presentation/d/deck_${companySlug}_${i}`;
        const cplLink = `https://cpl.${companySlug}.io/link/${i}`;
        const keyInsight = keyInsights[i % keyInsights.length];
        const nextAction = nextActions[i % nextActions.length];
        // Generate varied reminder dates (within next 60 days)
        const reminderDaysOffset = (i % 60) + 1;
        const reminderDateObj = new Date(2024, 0, 15 + reminderDaysOffset);
        const reminderDate = reminderDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        data.push({
            id: i,
            company,
            industry,
            location,
            founderName,
            founderContact,
            round,
            amount,
            valuation,
            status,
            dealLead,
            dateAdded,
            source,
            summary,
            notes,
            deckLink,
            cplLink,
            keyInsight,
            nextAction,
            reminderDate,
            link: `https://${company.toLowerCase().replace(/\s+/g, '')}.example.com`
        });
    }
    return data;
}

// Data and state
const state = {
    allData: [],
    filteredData: [],
    selectedItems: new Set(),
    sortColumn: null,
    sortDirection: 'asc',
    history: [], // Undo stack
    historyIndex: -1, // Current position in history
    maxHistorySize: 50 // Maximum number of actions to keep in history
};

// Initialize data from backend
async function initializeData() {
    setLoadingState(true);
    try {
        const result = await window.backend.applications.fetchAll();
        if (result.success) {
            state.allData = result.data || [];
            state.filteredData = [...state.allData];
            renderTable();
            showNotification(`Loaded ${state.allData.length} application(s) from backend.`);
        } else {
            showError(result.error || 'Failed to load data from backend');
            // Fallback to empty array
            state.allData = [];
            state.filteredData = [];
            renderTable();
        }
    } catch (error) {
        showError(`Failed to connect to backend: ${error.message}`);
        // Fallback to empty array
        state.allData = [];
        state.filteredData = [];
        renderTable();
    } finally {
        setLoadingState(false);
    }
}

// DOM elements
const elements = {
    tableBody: document.getElementById('tableBody'),
    selectAllCheckbox: document.getElementById('selectAll'),
    searchInput: document.getElementById('searchInput'),
    showingInfo: document.getElementById('showingInfo'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    deleteBtn: document.getElementById('deleteBtn'),
    deleteBtnText: document.getElementById('deleteBtnText'),
    editBtn: document.getElementById('editBtn'),
    editBtnText: document.getElementById('editBtnText'),
    editModal: document.getElementById('editModal'),
    closeEditModal: document.getElementById('closeEditModal'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    editForm: document.getElementById('editForm'),
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    deleteConfirmMessage: document.getElementById('deleteConfirmMessage'),
    deleteConfirmCancel: document.getElementById('deleteConfirmCancel'),
    deleteConfirmDelete: document.getElementById('deleteConfirmDelete'),
    undoBtn: document.getElementById('undoBtn'),
    redoBtn: document.getElementById('redoBtn'),
    appContainer: document.getElementById('app-container'),
    rightSidebar: document.getElementById('rightSidebar'),
    rightSidebarToggle: document.getElementById('rightSidebarToggle'),
    rightSidebarClose: document.getElementById('rightSidebarClose'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    chatSendBtn: document.getElementById('chatSendBtn'),
    summaryBtn: document.getElementById('summaryBtn'),
    summaryBlocksContainer: document.getElementById('summaryBlocksContainer')
};

// Helper function to get status badge class
function getStatusBadgeClass(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'pending') return 'status-badge pending';
    if (statusLower === 'accepted') return 'status-badge accepted';
    if (statusLower === 'rejected') return 'status-badge rejected';
    return 'status-badge';
}

// Render functions
function renderTable() {
    const { filteredData, selectedItems } = state;
    
    elements.tableBody.innerHTML = filteredData.map((item, index) => `
        <tr class="startup-table-row ${selectedItems.has(item.id) ? 'selected' : ''}" data-id="${item.id}" data-application-id="${item.id}" data-status="${(item.status || 'source').toLowerCase()}">
            <td class="py-3 px-4 sticky-col-1">
                <div class="flex items-center gap-3">
                    <div class="table-checkbox-wrapper">
                        <label class="custom-checkbox-container">
                            <input type="checkbox" class="row-checkbox" data-id="${item.id}" ${selectedItems.has(item.id) ? 'checked' : ''}>
                            <div class="custom-checkbox-visual"></div>
                        </label>
                    </div>
                    <div class="p-2 bg-blue-50 rounded-lg startup-icon-container">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <div class="font-medium startup-name-link" data-id="${item.id}">${item.company}</div>
                    </div>
                </div>
            </td>
            <td class="py-3 px-4">${item.industry || '-'}</td>
            <td class="py-3 px-4">${item.location || '-'}</td>
            <td class="py-3 px-4">${item.founderName || '-'}</td>
            <td class="py-3 px-4">
                <a href="mailto:${item.founderContact || '#'}" class="text-blue-600 hover:underline">${item.founderContact || '-'}</a>
            </td>
            <td class="py-3 px-4">
                <span class="round-badge round-badge-${(item.round || '').toLowerCase().replace(/\s+/g, '-')}">${item.round || '-'}</span>
            </td>
            <td class="py-3 px-4">${item.amount || '-'}</td>
            <td class="py-3 px-4">${item.valuation || '-'}</td>
            <td class="py-3 px-4" data-status="${(item.status || 'source').toLowerCase()}">
                <span class="status-badge ${getStatusBadgeClass(item.status || 'source')}">${item.status || 'Source'}</span>
            </td>
            <td class="py-3 px-4">${item.dealLead || '-'}</td>
            <td class="py-3 px-4">${item.dateAdded || '-'}</td>
            <td class="py-3 px-4">${item.source || '-'}</td>
            <td class="py-3 px-4" title="${item.summary || ''}">${item.summary || '-'}</td>
            <td class="py-3 px-4" title="${item.notes || ''}">${item.notes || '-'}</td>
            <td class="py-3 px-4">
                ${item.deckLink ? `<a href="${item.deckLink}" target="_blank" class="text-blue-600 hover:underline">View</a>` : '-'}
            </td>
            <td class="py-3 px-4">
                ${item.cplLink ? `<a href="${item.cplLink}" target="_blank" class="text-blue-600 hover:underline">View</a>` : '-'}
            </td>
            <td class="py-3 px-4" title="${item.keyInsight || ''}">${item.keyInsight || '-'}</td>
            <td class="py-3 px-4">${item.nextAction || '-'}</td>
            <td class="py-3 px-4">${item.reminderDate || '-'}</td>
            <td class="py-3 px-4 actions-cell"></td>
        </tr>
    `).join('');
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.row-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleRowCheckboxChange);
    });
    
    // Add event listeners to startup name links
    document.querySelectorAll('.startup-name-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            openStartupDetail(id);
        });
    });
    
    updateSelectAllCheckbox();
    updateShowingInfo();
    updateDeleteButton();
    updateEditButton();
}

function updateShowingInfo() {
    const { filteredData } = state;
    elements.showingInfo.textContent = `Showing ${filteredData.length} of ${state.allData.length} results`;
}

function updateSelectAllCheckbox() {
    const { filteredData, selectedItems } = state;
    const allSelected = filteredData.length > 0 && filteredData.every(item => selectedItems.has(item.id));
    elements.selectAllCheckbox.checked = allSelected;
    updateDeleteButton();
    updateEditButton();
}

function updateDeleteButton() {
    const { selectedItems } = state;
    const selectedCount = selectedItems.size;
    
    if (selectedCount > 0) {
        elements.deleteBtn.style.display = 'flex';
        elements.deleteBtnText.textContent = `Delete (${selectedCount})`;
    } else {
        elements.deleteBtn.style.display = 'none';
    }
}

function updateEditButton() {
    const { selectedItems } = state;
    const selectedCount = selectedItems.size;
    
    // Only show Edit button when exactly 1 item is selected
    if (selectedCount === 1) {
        elements.editBtn.style.display = 'flex';
        elements.editBtnText.textContent = 'Edit';
    } else {
        elements.editBtn.style.display = 'none';
    }
    
    // Update summary blocks when selection changes
    updateSummaryBlocks();
}

// Event handlers
function handleRowCheckboxChange(e) {
    const id = parseInt(e.target.dataset.id);
    if (e.target.checked) {
        state.selectedItems.add(id);
    } else {
        state.selectedItems.delete(id);
    }
    e.target.closest('tr').classList.toggle('selected', e.target.checked);
    updateSelectAllCheckbox();
}

function handleDelete() {
    const { selectedItems } = state;
    const selectedCount = selectedItems.size;
    
    if (selectedCount === 0) {
        return;
    }
    
    // Show custom delete confirmation modal
    openDeleteConfirmModal(selectedCount);
}

function openDeleteConfirmModal(count) {
    // Update message based on count
    const message = count === 1 
        ? 'Are you sure you want to delete this item? This action cannot be undone.'
        : `Are you sure you want to delete ${count} item(s)? This action cannot be undone.`;
    
    elements.deleteConfirmMessage.textContent = message;
    // Use flex so the modal container keeps its centering styles
    elements.deleteConfirmModal.style.display = 'flex';
}

function closeDeleteConfirmModal() {
    elements.deleteConfirmModal.style.display = 'none';
}

async function confirmDelete() {
    const { selectedItems, allData } = state;
    const selectedCount = selectedItems.size;
    
    if (selectedCount === 0) {
        return;
    }
    
    // Store deleted items for undo
    const deletedItems = allData.filter(item => selectedItems.has(item.id));
    const itemIds = Array.from(selectedItems);
    
    // Close modal first
    closeDeleteConfirmModal();
    setLoadingState(true);
    
    try {
        // Delete from backend
        const deletePromises = itemIds.map(id => window.backend.applications.delete(id));
        const results = await Promise.all(deletePromises);
        
        // Check if all deletions succeeded
        const allSucceeded = results.every(result => result.success);
        
        if (allSucceeded) {
            // Remove selected items from allData
            state.allData = state.allData.filter(item => !selectedItems.has(item.id));
            
            // Add to history for undo
            addToHistory({
                type: 'delete',
                items: deletedItems,
                reverseType: 'restore'
            });
            
            // Clear selected items
            selectedItems.clear();
            
            // Update filtered data
            handleSearch();
            
            // Show notification
            showNotification(`Successfully deleted ${selectedCount} item(s).`);
        } else {
            // Some deletions failed
            const failedCount = results.filter(r => !r.success).length;
            showError(`Failed to delete ${failedCount} item(s). Please try again.`);
        }
    } catch (error) {
        showError(`Error deleting items: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

function handleEdit() {
    const { selectedItems, allData } = state;
    const selectedCount = selectedItems.size;
    
    // Only allow editing when exactly 1 item is selected
    if (selectedCount !== 1) {
        return;
    }
    
    // Get the selected item
    const selectedIds = Array.from(selectedItems);
    const item = allData.find(item => item.id === selectedIds[0]);
    
    if (!item) {
        return;
    }
    
    openEditModal(item);
}

function openEditModal(item) {
    // Populate form with item data
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editCompany').value = item.company || '';
    document.getElementById('editIndustry').value = item.industry || '';
    document.getElementById('editLocation').value = item.location || '';
    document.getElementById('editFounderName').value = item.founderName || '';
    document.getElementById('editFounderContact').value = item.founderContact || '';
    document.getElementById('editRound').value = item.round || '';
    document.getElementById('editAmount').value = item.amount || '';
    document.getElementById('editValuation').value = item.valuation || '';
    document.getElementById('editStatus').value = item.status || '';
    document.getElementById('editDealLead').value = item.dealLead || '';
    document.getElementById('editSummary').value = item.summary || '';
    document.getElementById('editNotes').value = item.notes || '';
    document.getElementById('editDeckLink').value = item.deckLink || '';
    document.getElementById('editCplLink').value = item.cplLink || '';
    document.getElementById('editKeyInsight').value = item.keyInsight || '';
    document.getElementById('editNextAction').value = item.nextAction || '';
    document.getElementById('editReminderDate').value = item.reminderDate || '';
    document.getElementById('editSource').value = item.source || '';
    
    // Show modal (use flex so CSS centering works)
    elements.editModal.style.display = 'flex';
}

function closeEditModal() {
    elements.editModal.style.display = 'none';
    elements.editForm.reset();
}

async function saveEdit() {
    const itemId = document.getElementById('editItemId').value;
    
    if (!itemId) {
        return;
    }
    
    // Find the item in allData
    const item = state.allData.find(item => item.id === itemId);
    
    if (!item) {
        showNotification('Item not found.');
        return;
    }
    
    // Store old state for undo
    const oldState = JSON.parse(JSON.stringify(item));
    
    // Collect form values
    const updateData = {
        company: document.getElementById('editCompany').value || '',
        industry: document.getElementById('editIndustry').value || '',
        location: document.getElementById('editLocation').value || '',
        founderName: document.getElementById('editFounderName').value || '',
        founderContact: document.getElementById('editFounderContact').value || '',
        round: document.getElementById('editRound').value || '',
        amount: document.getElementById('editAmount').value || '',
        valuation: document.getElementById('editValuation').value || '',
        status: document.getElementById('editStatus').value || '',
        dealLead: document.getElementById('editDealLead').value || '',
        summary: document.getElementById('editSummary').value || '',
        notes: document.getElementById('editNotes').value || '',
        deckLink: document.getElementById('editDeckLink').value || '',
        cplLink: document.getElementById('editCplLink').value || '',
        keyInsight: document.getElementById('editKeyInsight').value || '',
        nextAction: document.getElementById('editNextAction').value || '',
        reminderDate: document.getElementById('editReminderDate').value || '',
        source: document.getElementById('editSource').value || ''
    };
    
    // Close modal first
    closeEditModal();
    setLoadingState(true);
    
    try {
        // Update in backend
        const result = await window.backend.applications.update(itemId, updateData);
        
        if (result.success) {
            // Update item with form values
            Object.assign(item, updateData);
            
            // Store new state
            const newState = JSON.parse(JSON.stringify(item));
            
            // Add to history for undo
            addToHistory({
                type: 'edit',
                itemId: itemId,
                oldState: oldState,
                newState: newState,
                reverseType: 'edit'
            });
            
            // Update filtered data and re-render
            const currentSearch = elements.searchInput.value.toLowerCase();
            if (currentSearch) {
                handleSearch();
            } else {
                state.filteredData = [...state.allData];
                renderTable();
            }
            
            // Update summary blocks if the edited item is selected
            updateSummaryBlocks();
            
            // Show notification
            showNotification('Application updated successfully.');
        } else {
            showError(result.error || 'Failed to update application');
        }
    } catch (error) {
        showError(`Error updating application: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

function handleSelectAllChange(e) {
    const { filteredData } = state;
    
    if (e.target.checked) {
        filteredData.forEach(item => state.selectedItems.add(item.id));
    } else {
        filteredData.forEach(item => state.selectedItems.delete(item.id));
    }
    
    renderTable();
    updateDeleteButton();
    updateEditButton();
}

function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    
    if (searchTerm) {
        state.filteredData = state.allData.filter(item => 
            (item.company && item.company.toLowerCase().includes(searchTerm)) ||
            (item.industry && item.industry.toLowerCase().includes(searchTerm)) ||
            (item.location && item.location.toLowerCase().includes(searchTerm)) ||
            (item.founderName && item.founderName.toLowerCase().includes(searchTerm)) ||
            (item.founderContact && item.founderContact.toLowerCase().includes(searchTerm)) ||
            (item.round && item.round.toLowerCase().includes(searchTerm)) ||
            (item.amount && item.amount.includes(searchTerm)) ||
            (item.valuation && item.valuation.includes(searchTerm)) ||
            (item.status && item.status.toLowerCase().includes(searchTerm)) ||
            (item.dealLead && item.dealLead.toLowerCase().includes(searchTerm)) ||
            (item.dateAdded && item.dateAdded.toLowerCase().includes(searchTerm)) ||
            (item.source && item.source.toLowerCase().includes(searchTerm)) ||
            (item.summary && item.summary.toLowerCase().includes(searchTerm)) ||
            (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
            (item.keyInsight && item.keyInsight.toLowerCase().includes(searchTerm)) ||
            (item.nextAction && item.nextAction.toLowerCase().includes(searchTerm))
        );
    } else {
        state.filteredData = [...state.allData];
    }
    
    renderTable();
}

function handleSort(column) {
    if (state.sortColumn === column) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortColumn = column;
        state.sortDirection = 'asc';
    }
    
    // Update sort icons
    document.querySelectorAll('.column-sort-icon').forEach(icon => {
        icon.classList.remove('asc', 'desc');
        if (icon.dataset.sort === column) {
            icon.classList.add(state.sortDirection);
        }
    });
    
    // Sort data
    state.filteredData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (column === 'amount' || column === 'valuation') {
            // Remove currency symbols and convert to number
            aVal = parseFloat(aVal.replace(/[^0-9.]/g, ''));
            bVal = parseFloat(bVal.replace(/[^0-9.]/g, ''));
        }
        
        if (state.sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    renderTable();
}

function showNotification(message) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// History management functions
function addToHistory(action) {
    // Remove any actions after current index (when user does new action after undoing)
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    
    // Add new action
    state.history.push(action);
    state.historyIndex = state.history.length - 1;
    
    // Limit history size
    if (state.history.length > state.maxHistorySize) {
        state.history.shift();
        state.historyIndex--;
    }
    
    // Update button states
    updateUndoRedoButtons();
}

function undo() {
    if (state.historyIndex < 0 || state.history.length === 0) {
        return;
    }
    
    const action = state.history[state.historyIndex];
    
    if (action.type === 'delete') {
        // Restore deleted items back to allData
        action.items.forEach(item => {
            // Check if item doesn't already exist (to prevent duplicates)
            const exists = state.allData.find(existing => existing.id === item.id);
            if (!exists) {
                state.allData.push(item);
            }
        });
        // Sort by ID to maintain order
        state.allData.sort((a, b) => a.id - b.id);
        showNotification(`Restored ${action.items.length} item(s).`);
    } else if (action.type === 'edit') {
        // Restore old state
        const item = state.allData.find(item => item.id === action.itemId);
        if (item) {
            Object.assign(item, action.oldState);
        }
        showNotification('Edit undone.');
    }
    
    state.historyIndex--;
    
    // Update UI
    handleSearch();
    updateUndoRedoButtons();
}

function redo() {
    if (state.historyIndex + 1 >= state.history.length) {
        return;
    }
    
    state.historyIndex++;
    const action = state.history[state.historyIndex];
    
    if (action.type === 'delete') {
        // Delete items again
        const itemIds = action.items.map(item => item.id);
        state.allData = state.allData.filter(item => !itemIds.includes(item.id));
        showNotification(`Deleted ${action.items.length} item(s).`);
    } else if (action.type === 'edit') {
        // Apply new state again
        const item = state.allData.find(item => item.id === action.itemId);
        if (item) {
            Object.assign(item, action.newState);
        }
        showNotification('Edit redone.');
    }
    
    // Update UI
    handleSearch();
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    // Enable/disable undo button
    elements.undoBtn.disabled = state.historyIndex < 0;
    
    // Enable/disable redo button
    elements.redoBtn.disabled = state.historyIndex + 1 >= state.history.length;
}

// Event listeners
elements.selectAllCheckbox.addEventListener('change', handleSelectAllChange);
elements.searchInput.addEventListener('input', handleSearch);
elements.deleteBtn.addEventListener('click', handleDelete);
elements.editBtn.addEventListener('click', handleEdit);
elements.closeEditModal.addEventListener('click', closeEditModal);
elements.cancelEditBtn.addEventListener('click', closeEditModal);
elements.saveEditBtn.addEventListener('click', saveEdit);
elements.deleteConfirmCancel.addEventListener('click', closeDeleteConfirmModal);
elements.deleteConfirmDelete.addEventListener('click', confirmDelete);
elements.undoBtn.addEventListener('click', undo);
elements.redoBtn.addEventListener('click', redo);

// Close modal when clicking overlay
elements.editModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-modal-overlay')) {
        closeEditModal();
    }
});

elements.deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-confirm-overlay')) {
        closeDeleteConfirmModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (elements.editModal.style.display === 'block') {
            closeEditModal();
        }
        if (elements.deleteConfirmModal.style.display === 'block') {
            closeDeleteConfirmModal();
        }
    }
});

// Sort event listeners
document.querySelectorAll('.column-sort-icon').forEach(icon => {
    icon.addEventListener('click', () => handleSort(icon.dataset.sort));
});

function openStartupDetail(id) {
    // Store the startup ID in localStorage
    localStorage.setItem('selectedStartupId', id);
    
    // Navigate to detail page
    window.location.href = 'detail.html';
}

// --- Sidebar Functionality ---
function toggleRightSidebar() {
    // Instead of toggling sidebar, open the detachable chat window
    window.backend.send('open-chat-window');
}

// --- Summary Blocks Functionality ---
let blockCounter = 0;

function createSummaryBlock() {
    blockCounter++;
    const blockId = `block-${blockCounter}`;
    const { selectedItems, allData } = state;
    const selectedCount = selectedItems.size;
    
    let blockContent = '';
    if (selectedCount === 1) {
        const selectedIds = Array.from(selectedItems);
        const item = allData.find(item => item.id === selectedIds[0]);
        if (item) {
            blockContent = renderSummaryBlockContent(item);
        } else {
            blockContent = renderSummaryPlaceholder();
        }
    } else {
        blockContent = renderSummaryPlaceholder();
    }
    
    const blockHTML = `
        <div class="summary-block" data-block-id="${blockId}">
            <div class="summary-block-header">
                <h3 class="summary-block-title">Summary ${blockCounter > 1 ? blockCounter : ''}</h3>
                <button class="summary-block-delete" title="Delete block">
                    <svg xmlns="http://www.w3.org/2000/svg" class="summary-block-delete-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="summary-block-content">
                ${blockContent}
            </div>
        </div>
    `;
    
    // Insert at the top
    elements.summaryBlocksContainer.insertAdjacentHTML('afterbegin', blockHTML);
    
    // Add delete event listener
    const newBlock = elements.summaryBlocksContainer.querySelector(`[data-block-id="${blockId}"]`);
    const deleteBtn = newBlock.querySelector('.summary-block-delete');
    deleteBtn.addEventListener('click', () => {
        // Don't allow deleting the last block
        const allBlocks = elements.summaryBlocksContainer.querySelectorAll('.summary-block');
        if (allBlocks.length > 1) {
            newBlock.remove();
        }
    });
    
    // Show delete button on default block if we have multiple blocks
    const allBlocks = elements.summaryBlocksContainer.querySelectorAll('.summary-block');
    if (allBlocks.length > 1) {
        const defaultBlock = elements.summaryBlocksContainer.querySelector('[data-block-id="default"]');
        if (defaultBlock) {
            const defaultDeleteBtn = defaultBlock.querySelector('.summary-block-delete');
            if (defaultDeleteBtn) {
                defaultDeleteBtn.style.display = 'block';
            }
        }
    }
}

function updateSummaryBlocks() {
    const { selectedItems, allData } = state;
    const selectedCount = selectedItems.size;
    
    const blocks = elements.summaryBlocksContainer.querySelectorAll('.summary-block');
    blocks.forEach(block => {
        const contentDiv = block.querySelector('.summary-block-content');
        if (selectedCount === 1) {
            const selectedIds = Array.from(selectedItems);
            const item = allData.find(item => item.id === selectedIds[0]);
            if (item) {
                contentDiv.innerHTML = renderSummaryBlockContent(item);
            } else {
                contentDiv.innerHTML = renderSummaryPlaceholder();
            }
        } else {
            contentDiv.innerHTML = renderSummaryPlaceholder();
        }
    });
}

function renderSummaryPlaceholder() {
    return `
        <div class="summary-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" class="summary-placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="summary-placeholder-text">Select a startup to view summary</p>
        </div>
    `;
}

function renderSummaryBlockContent(item) {
    const roundClass = (item.round || '').toLowerCase().replace(/\s+/g, '-');
    const statusClass = (item.status || 'source').toLowerCase().replace(/\s+/g, '-');
    
    return `
        <div class="summary-content active">
            <div class="summary-section">
                <div class="summary-section-title">Company Information</div>
                <div class="summary-field">
                    <span class="summary-field-label">Company Name</span>
                    <div class="summary-field-value">${item.company || '-'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Industry</span>
                    <div class="summary-field-value">${item.industry || '-'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Location</span>
                    <div class="summary-field-value">${item.location || '-'}</div>
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-section-title">Funding Details</div>
                <div class="summary-field">
                    <span class="summary-field-label">Round</span>
                    <div class="summary-field-value">
                        ${item.round ? `<span class="round-badge round-badge-${roundClass}">${item.round}</span>` : '-'}
                    </div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Amount Raising</span>
                    <div class="summary-field-value">${item.amount || '-'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Valuation</span>
                    <div class="summary-field-value">${item.valuation || '-'}</div>
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-section-title">Status & Lead</div>
                <div class="summary-field">
                    <span class="summary-field-label">Status</span>
                    <div class="summary-field-value">
                        ${item.status ? `<span class="status-badge status-badge-${statusClass}">${item.status}</span>` : '-'}
                    </div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Deal Lead</span>
                    <div class="summary-field-value">${item.dealLead || '-'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Source</span>
                    <div class="summary-field-value">${item.source || '-'}</div>
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-section-title">Founder Information</div>
                <div class="summary-field">
                    <span class="summary-field-label">Founder Name</span>
                    <div class="summary-field-value">${item.founderName || '-'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Contact</span>
                    <div class="summary-field-value">
                        ${item.founderContact ? `<a href="mailto:${item.founderContact}">${item.founderContact}</a>` : '-'}
                    </div>
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-section-title">Overview</div>
                <div class="summary-field">
                    <span class="summary-field-label">Summary</span>
                    <div class="summary-field-value ${!item.summary ? 'empty' : ''}">${item.summary || 'No summary available'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Key Insight</span>
                    <div class="summary-field-value ${!item.keyInsight ? 'empty' : ''}">${item.keyInsight || 'No key insight available'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Next Action</span>
                    <div class="summary-field-value ${!item.nextAction ? 'empty' : ''}">${item.nextAction || 'No next action set'}</div>
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-section-title">Additional Information</div>
                <div class="summary-field">
                    <span class="summary-field-label">Date Added</span>
                    <div class="summary-field-value">${item.dateAdded || '-'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Reminder Date</span>
                    <div class="summary-field-value">${item.reminderDate || '-'}</div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">Deck Link</span>
                    <div class="summary-field-value">
                        ${item.deckLink ? `<a href="${item.deckLink}" target="_blank">View Deck</a>` : '-'}
                    </div>
                </div>
                <div class="summary-field">
                    <span class="summary-field-label">CPL Link</span>
                    <div class="summary-field-value">
                        ${item.cplLink ? `<a href="${item.cplLink}" target="_blank">View CPL</a>` : '-'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- AI Chat Functionality ---
function addChatMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'chat-message-user' : 'chat-message-ai'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'chat-message-content';
    
    const p = document.createElement('p');
    p.textContent = message;
    contentDiv.appendChild(p);
    
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function handleChatSend() {
    const message = elements.chatInput.value.trim();
    
    if (!message) {
        return;
    }
    
    // Add user message
    addChatMessage(message, true);
    
    // Clear input
    elements.chatInput.value = '';
    
    // Disable send button
    if (elements.chatSendBtn) {
        elements.chatSendBtn.disabled = true;
    }
    
    // Simulate AI response (replace with actual LLM API call)
    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        addChatMessage(aiResponse, false);
        if (elements.chatSendBtn) {
            elements.chatSendBtn.disabled = false;
        }
    }, 1000);
}

function generateAIResponse(userMessage) {
    // This is a placeholder - replace with actual LLM API integration
    const message = userMessage.toLowerCase();
    
    // Simple keyword-based responses (replace with actual LLM)
    if (message.includes('summary') || message.includes('overview')) {
        return `Based on your portfolio, I can see you have ${state.allData.length} startups in your database. Would you like me to analyze specific metrics or provide insights on a particular startup?`;
    } else if (message.includes('status') || message.includes('stage')) {
        const statusCounts = {};
        state.allData.forEach(item => {
            statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        });
        const statusSummary = Object.entries(statusCounts)
            .map(([status, count]) => `${status}: ${count}`)
            .join(', ');
        return `Here's the status breakdown of your portfolio: ${statusSummary}. Would you like more detailed analysis?`;
    } else if (message.includes('help') || message.includes('what can you do')) {
        return `I can help you with:
- Portfolio analysis and insights
- Startup summaries and metrics
- Status tracking and reminders
- Data queries and filtering
- Investment recommendations

What would you like to know?`;
    } else {
        return `I understand you're asking about "${userMessage}". To provide more accurate insights, I can analyze your portfolio data. Would you like me to:
1. Generate a summary of your selected startup?
2. Analyze portfolio metrics?
3. Provide investment insights?

Or feel free to ask a more specific question!`;
    }
}

// Event listeners for sidebars
if (elements.rightSidebarToggle) {
    elements.rightSidebarToggle.addEventListener('click', toggleRightSidebar);
}

if (elements.rightSidebarClose) {
    elements.rightSidebarClose.addEventListener('click', toggleRightSidebar);
}

// Summary button functionality
if (elements.summaryBtn) {
    elements.summaryBtn.addEventListener('click', createSummaryBlock);
}

// Chat functionality
if (elements.chatSendBtn) {
    elements.chatSendBtn.addEventListener('click', handleChatSend);
}

if (elements.chatInput) {
    elements.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSend();
        }
    });
    
    elements.chatInput.addEventListener('input', () => {
        if (elements.chatSendBtn) {
            elements.chatSendBtn.disabled = !elements.chatInput.value.trim();
        }
    });
}

// Initial render - load data from backend
initializeData().then(() => {
    updateUndoRedoButtons();
    updateSummaryBlocks();
});

// Initialize chat send button state
if (elements.chatSendBtn) {
    elements.chatSendBtn.disabled = true;
}

// Add delete listeners to existing summary blocks
document.querySelectorAll('.summary-block-delete').forEach(btn => {
    btn.addEventListener('click', function() {
        const block = this.closest('.summary-block');
        const allBlocks = elements.summaryBlocksContainer.querySelectorAll('.summary-block');
        if (allBlocks.length > 1) {
            block.remove();
        }
    });
});

// ============================================================================
// BACKEND INTEGRATION - New Features
// ============================================================================

/**
 * Notification System
 */
window.showNotification = function(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
    notification.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
        <button class="notification-close">×</button>
    `;

    document.body.appendChild(notification);

    // Close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => notification.remove());

    // Auto-dismiss
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

/**
 * Backend Connection Status Indicator
 */
let connectionStatusInterval = null;

async function updateConnectionStatus() {
    const indicator = document.getElementById('backendStatusIndicator');
    if (!indicator) return;

    try {
        const status = await window.backend.getConnectionStatus();
        const dot = indicator.querySelector('.status-dot');
        const text = indicator.querySelector('.status-text');

        if (dot && text) {
            dot.className = 'status-dot';
            if (status.status === 'connected') {
                dot.classList.add('status-connected');
                text.textContent = 'Connected';
            } else if (status.status === 'disconnected') {
                dot.classList.add('status-disconnected');
                text.textContent = 'Disconnected';
            } else if (status.status === 'connecting') {
                dot.classList.add('status-connecting');
                text.textContent = 'Connecting...';
            } else {
                dot.classList.add('status-unknown');
                text.textContent = 'Unknown';
            }
        }
    } catch (error) {
        console.error('Error updating connection status:', error);
    }
}

async function checkBackendHealth() {
    try {
        const result = await window.backend.healthCheck();
        if (result && result.connected) {
            showNotification('Backend connected', 'success', 3000);
        } else {
            showNotification('Backend disconnected', 'error', 3000);
        }
        await updateConnectionStatus();
    } catch (error) {
        console.error('Health check failed:', error);
        await updateConnectionStatus();
    }
}

// Initialize connection status
updateConnectionStatus();
// Check health every 30 seconds
connectionStatusInterval = setInterval(checkBackendHealth, 30000);

// Click indicator to manually check health
const statusIndicator = document.getElementById('backendStatusIndicator');
if (statusIndicator) {
    statusIndicator.addEventListener('click', checkBackendHealth);
}

/**
 * Navigation Tabs
 */
let currentTab = 'applications';

function switchTab(tabName) {
    currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Show/hide views
    const applicationsView = document.getElementById('applicationsView');
    const startupsView = document.getElementById('startupsView');
    const meetingsView = document.getElementById('meetingsView');
    const createMeetingBtn = document.getElementById('createMeetingBtn');
    const statusFilter = document.getElementById('statusFilter');
    const sectionTitle = document.getElementById('sectionTitle');

    if (applicationsView) applicationsView.style.display = tabName === 'applications' ? 'block' : 'none';
    if (startupsView) startupsView.style.display = tabName === 'startups' ? 'block' : 'none';
    if (meetingsView) meetingsView.style.display = tabName === 'meetings' ? 'block' : 'none';
    if (createMeetingBtn) createMeetingBtn.style.display = tabName === 'meetings' ? 'block' : 'none';
    if (statusFilter) statusFilter.style.display = tabName === 'applications' ? 'block' : 'none';

    // Update section title
    if (sectionTitle) {
        if (tabName === 'applications') {
            sectionTitle.textContent = 'Open opportunities';
        } else if (tabName === 'startups') {
            sectionTitle.textContent = 'Startups';
        } else if (tabName === 'meetings') {
            sectionTitle.textContent = 'Meetings';
        }
    }

    // Load data for the active tab
    if (tabName === 'startups' && typeof loadStartups === 'function') {
        loadStartups();
    } else if (tabName === 'meetings' && typeof loadMeetings === 'function') {
        loadMeetings();
    }
}

// Set up tab click handlers
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        if (tabName) {
            switchTab(tabName);
        }
    });
});

/**
 * Status Filtering for Applications
 */
let currentStatusFilter = 'all';

function filterApplicationsByStatus(status) {
    currentStatusFilter = status;
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const statusCell = row.querySelector('[data-status]');
        if (!statusCell) {
            // Try to find status in the row
            const statusText = row.textContent.toLowerCase();
            const hasStatus = statusText.includes(status.toLowerCase());
            
            if (status === 'all') {
                row.style.display = '';
            } else {
                row.style.display = hasStatus ? '' : 'none';
            }
        } else {
            const rowStatus = statusCell.getAttribute('data-status').toLowerCase();
            if (status === 'all' || rowStatus === status.toLowerCase()) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });

    // Update showing info
    const visibleRows = Array.from(rows).filter(r => r.style.display !== 'none');
    const showingInfo = document.getElementById('showingInfo');
    if (showingInfo) {
        showingInfo.textContent = `Showing ${visibleRows.length} of ${rows.length} applications`;
    }
}

const statusFilter = document.getElementById('statusFilter');
if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
        filterApplicationsByStatus(e.target.value);
    });
}

/**
 * Accept/Reject Application Buttons
 */
async function acceptApplication(applicationId) {
    if (!confirm('Are you sure you want to accept this application? This will create a startup.')) {
        return;
    }

    try {
        const response = await window.backend.applications.accept(applicationId);
        if (response && response.status === 'success') {
            const startupId = response.data?.startup_id || response.startup_id;
            showNotification(`Application accepted! Startup ID: ${startupId}`, 'success');
            // Refresh applications and startups
            await initializeData();
            if (typeof loadStartups === 'function') {
                await loadStartups();
            }
        } else {
            throw new Error('Failed to accept application');
        }
    } catch (error) {
        console.error('Error accepting application:', error);
        showNotification('Failed to accept application: ' + error.message, 'error');
    }
}

async function rejectApplication(applicationId) {
    if (!confirm('Are you sure you want to reject this application?')) {
        return;
    }

    try {
        const response = await window.backend.applications.reject(applicationId);
        if (response && response.status === 'success') {
            showNotification('Application rejected', 'success');
            // Refresh applications
            await initializeData();
        } else {
            throw new Error('Failed to reject application');
        }
    } catch (error) {
        console.error('Error rejecting application:', error);
        showNotification('Failed to reject application: ' + error.message, 'error');
    }
}

/**
 * Add Accept/Reject buttons to application rows
 */
function addAcceptRejectButtons() {
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(row => {
        // Check if buttons already exist
        if (row.querySelector('.btn-accept, .btn-reject')) {
            return;
        }

        // Find the last cell or create actions cell
        let actionsCell = row.querySelector('.actions-cell');
        if (!actionsCell) {
            actionsCell = document.createElement('td');
            actionsCell.className = 'px-4 py-3 actions-cell';
            row.appendChild(actionsCell);
        }

        // Get application ID from row data or first cell
        const applicationId = row.getAttribute('data-application-id') || 
                             row.querySelector('td')?.getAttribute('data-id') ||
                             row.querySelector('td')?.textContent?.trim();

        // Check status - only show buttons for pending applications
        const statusCell = row.querySelector('[data-status]') || 
                          Array.from(row.querySelectorAll('td')).find(td => 
                              td.textContent.toLowerCase().includes('pending')
                          );

        if (statusCell || row.textContent.toLowerCase().includes('pending')) {
            actionsCell.innerHTML = `
                <button class="btn-accept" data-app-id="${applicationId}" title="Accept Application">Accept</button>
                <button class="btn-reject" data-app-id="${applicationId}" title="Reject Application">Reject</button>
            `;

            // Add event listeners
            const acceptBtn = actionsCell.querySelector('.btn-accept');
            const rejectBtn = actionsCell.querySelector('.btn-reject');

            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => acceptApplication(applicationId));
            }
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => rejectApplication(applicationId));
            }
        }
    });
}

// Call after data loads
const originalInitializeData = initializeData;
initializeData = async function() {
    await originalInitializeData();
    addAcceptRejectButtons();
    filterApplicationsByStatus(currentStatusFilter);
};

/**
 * Main Recording Button Handler
 */
const mainRecordingBtn = document.getElementById('mainRecordingBtn');
if (mainRecordingBtn) {
    mainRecordingBtn.addEventListener('click', () => {
        // Open chat window and trigger recording
        window.backend.send('open-chat-window');
        // Note: Recording will be started from chat window
        showNotification('Opening recording controls in chat window', 'info', 2000);
    });
}

/**
 * Auto-refresh Mechanism
 */
let autoRefreshInterval = null;

function startAutoRefresh() {
    // Clear existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }

    // Refresh applications every 30 seconds
    autoRefreshInterval = setInterval(async () => {
        if (currentTab === 'applications') {
            await initializeData();
        } else if (currentTab === 'startups' && typeof loadStartups === 'function') {
            await loadStartups();
        } else if (currentTab === 'meetings' && typeof loadMeetings === 'function') {
            await loadMeetings();
        }
    }, 30000); // 30 seconds
}

// Start auto-refresh
startAutoRefresh();

// Pause refresh when user is editing (detect modal open)
const observer = new MutationObserver(() => {
    const editModal = document.getElementById('editModal');
    const createMeetingModal = document.getElementById('createMeetingModal');
    const isModalOpen = (editModal && editModal.style.display !== 'none') ||
                       (createMeetingModal && createMeetingModal.style.display !== 'none');
    
    if (isModalOpen && autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    } else if (!isModalOpen && !autoRefreshInterval) {
        startAutoRefresh();
    }
});

observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

// Add CSS for slideOut animation
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}