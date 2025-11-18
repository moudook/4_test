// Universal Search functionality - works on any page
(function() {
    'use strict';
    
    // Get search input element
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) {
        return; // Search input not found on this page
    }
    
    // Detect current page type
    const currentPage = window.location.pathname.includes('detail.html') ? 'detail' : 'main';
    
    // Universal search handler
    function handleUniversalSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (currentPage === 'main') {
            // On main page, search the startup table
            if (typeof handleSearch === 'function') {
                handleSearch();
            }
        } else if (currentPage === 'detail') {
            // On detail page, search within the current page content
            searchDetailPage(searchTerm);
        }
        
        // Optionally, you can add navigation/search across pages here
        // For example, if search term matches a startup name, navigate to it
    }
    
    // Search within detail page content
    function searchDetailPage(searchTerm) {
        if (!searchTerm) {
            // Reset highlights
            document.querySelectorAll('.search-highlight').forEach(el => {
                el.classList.remove('search-highlight');
                const parent = el.parentNode;
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            });
            return;
        }
        
        // Search in textareas and visible text content
        const textareas = document.querySelectorAll('textarea');
        const detailCards = document.querySelectorAll('.detail-card');
        
        detailCards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            if (cardText.includes(searchTerm)) {
                card.style.border = '2px solid #6366f1';
                card.style.borderRadius = '8px';
            } else {
                card.style.border = '';
            }
        });
        
        // Highlight matching text in textareas (optional - just show which cards match)
        textareas.forEach(textarea => {
            const text = textarea.value.toLowerCase();
            if (text.includes(searchTerm)) {
                textarea.parentElement.parentElement.style.border = '2px solid #6366f1';
                textarea.parentElement.parentElement.style.borderRadius = '8px';
            }
        });
    }
    
    // Listen for input events (only if not already handled by page-specific script)
    if (currentPage === 'detail') {
        searchInput.addEventListener('input', handleUniversalSearch);
    }
    // On main page, renderer.js already handles search input
    
    // Listen for keyboard events
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUniversalSearch();
            
            // If on main page and search term matches a startup, navigate to it
            if (currentPage === 'main' && typeof state !== 'undefined' && state.allData) {
                const searchTerm = searchInput.value.toLowerCase().trim();
                const matchingStartup = state.allData.find(item => 
                    item.company.toLowerCase().includes(searchTerm)
                );
                
                if (matchingStartup) {
                    // Store the startup ID and navigate
                    localStorage.setItem('selectedStartupId', matchingStartup.id);
                    window.location.href = 'detail.html';
                }
            }
        } else if (e.key === 'Escape') {
            // Clear search on escape
            searchInput.value = '';
            handleUniversalSearch();
            searchInput.blur();
        }
    });
    
})();

