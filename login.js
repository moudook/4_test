document.addEventListener('DOMContentLoaded', function() {
    const wordInput = document.getElementById('wordInput');
    const submitBtn = document.getElementById('submitBtn');
    const closeBtn = document.getElementById('closeBtn');
    const errorMessage = document.getElementById('error-message');
    const loginForm = document.getElementById('login-form');
    
    // Handle form submission
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const word = wordInput.value.trim();
        
        if (word === 'admin') {
            // Clear any error message
            errorMessage.textContent = '';
            // Send success signal to main process
            if (window.backend && window.backend.send) {
                window.backend.send('login-success');
            }
        } else {
            // Show error message
            errorMessage.textContent = 'Invalid word. Please try again.';
            // Show error border
            wordInput.style.borderColor = '#ff5252';
            setTimeout(() => {
                wordInput.style.borderColor = '';
            }, 2000);
        }
    });
    
    // Handle Enter key press
    wordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Handle close button
    closeBtn.addEventListener('click', function() {
        // Close the login window via IPC
        if (window.backend && window.backend.send) {
            window.backend.send('close-login-window');
        }
    });
    
    // Focus on input when page loads
    wordInput.focus();
});
