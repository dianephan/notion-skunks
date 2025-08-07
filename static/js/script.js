document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newEntryForm');
    const entriesList = document.getElementById('entriesList');
    
    // Load existing entries on page load
    loadEntries();
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const linkUrl = document.getElementById('entryLink').value;
        const notes = document.getElementById('entryNotes').value;
        
        if (!linkUrl || !notes) {
            showNotification('Please fill in both link and notes!', 'error');
            return;
        }
        
        // Validate URL format
        try {
            new URL(linkUrl);
        } catch (error) {
            showNotification('Please enter a valid URL!', 'error');
            return;
        }
        
        // Disable submit button
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/notion/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: linkUrl,
                    content: notes
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Entry saved to Notion successfully!', 'success');
                form.reset();
                loadEntries(); // Reload entries
            } else {
                showNotification('Error: ' + (data.error || 'Failed to save entry'), 'error');
            }
        } catch (error) {
            showNotification('Network error: ' + error.message, 'error');
        } finally {
            // Re-enable submit button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Load entries from Notion
    async function loadEntries() {
        try {
            const response = await fetch('/api/notion/pages');
            const data = await response.json();
            
            if (data.pages && data.pages.length > 0) {
                displayEntries(data.pages);
            } else {
                entriesList.innerHTML = '<div class="loading">No entries found. Add your first link and notes above! 🌸</div>';
            }
        } catch (error) {
            entriesList.innerHTML = '<div class="loading">Unable to load entries. Check your Notion configuration. 🌸</div>';
        }
    }
    
    // Display entries in the UI
    function displayEntries(pages) {
        entriesList.innerHTML = '';
        
        pages.forEach(page => {
            const entryCard = document.createElement('div');
            entryCard.className = 'entry-card';
            entryCard.onclick = () => window.open(page.url, '_blank');
            
            const linkUrl = page.title || 'No URL';
            const notes = page.content || 'No notes';
            const date = new Date(page.created_time).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            entryCard.innerHTML = `
                <div class="entry-title">🔗 ${linkUrl}</div>
                <div class="entry-date">📅 ${date}</div>
                <div class="entry-preview">${notes}</div>
            `;
            
            entriesList.appendChild(entryCard);
        });
    }
    
    // Show notification
    function showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Add some cute animations
    const diaryContainer = document.querySelector('.diary-container');
    diaryContainer.style.opacity = '0';
    diaryContainer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        diaryContainer.style.transition = 'all 0.6s ease';
        diaryContainer.style.opacity = '1';
        diaryContainer.style.transform = 'translateY(0)';
    }, 100);
}); 