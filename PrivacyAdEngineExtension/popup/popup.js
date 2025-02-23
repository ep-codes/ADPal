// Update UI with current data
function updateUI() {
    chrome.storage.local.get(['currentAd', 'history', 'historyRetention', 'lastError', 'isLoading'], (data) => {
        // Update current ad
        const adContainer = document.getElementById("adContainer");
        const adElement = document.getElementById("adText");
        const adImageElement = document.getElementById("adImage");
        const loadingElement = document.getElementById("loadingSpinner");
        
        // Handle loading state
        if (data.isLoading) {
            loadingElement.style.display = 'block';
            adContainer.classList.add('loading');
            adElement.innerText = 'Loading...';
            adImageElement.style.display = 'none';
        } else {
            loadingElement.style.display = 'none';
            adContainer.classList.remove('loading');
            
            if (data.currentAd) {
                if (data.currentAd.image) {
                    adImageElement.src = data.currentAd.image; // Base64 image can be directly set as src
                    adImageElement.style.display = 'block';
                    adElement.innerText = data.currentAd.text || '';
                } else {
                    adImageElement.style.display = 'none';
                    adElement.innerText = data.currentAd.text || 'No ad selected';
                }
            } else {
                adImageElement.style.display = 'none';
                adElement.innerText = 'No ad selected';
            }
        }

        if (data.lastError) {
            adElement.classList.add('error');
            console.error('Last error:', data.lastError);
        } else {
            adElement.classList.remove('error');
        }
        
        // Update history retention dropdown
        const retention = data.historyRetention || 'month';
        const historyRetention = document.getElementById("historyRetention");
        if (historyRetention) {
            historyRetention.value = retention;
        }
        
        // Update history list
        const historyList = document.getElementById("historyList");
        if (historyList) {
            historyList.innerHTML = '';
            
            if (data.history && data.history.length > 0) {
                const recentHistory = data.history.slice(-5).reverse(); // Show last 5 entries
                recentHistory.forEach(entry => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    const date = new Date(entry.timestamp);
                    
                    // Create HTML for history item with image
                    let historyContent = `
                        <div class="history-info">
                            <span class="history-category">${entry.category}</span>
                            <span class="history-date">${date.toLocaleDateString()}</span>
                        </div>
                    `;
                    
                    if (entry.adContent && entry.adContent.image) {
                        historyContent += `
                            <div class="history-content">
                                <img src="${entry.adContent.image}" class="history-image" alt="Ad Image">
                                <span class="history-text">${entry.adContent.text}</span>
                            </div>
                        `;
                    } else {
                        historyContent += `
                            <div class="history-content">
                                <span class="history-text">${entry.adContent ? entry.adContent.text : 'No content available'}</span>
                            </div>
                        `;
                    }
                    
                    item.innerHTML = historyContent;
                    historyList.appendChild(item);
                });
            } else {
                historyList.innerHTML = '<p>No history available</p>';
            }
        }
    });
}

// Set up message listener for updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateUI') {
        updateUI();
    }
    // Must return false since we're not using sendResponse
    return false;
});

// Initialize UI when popup opens
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    
    // Navigation functionality
    const toggleNav = document.getElementById('toggleNav');
    const navMenu = document.getElementById('navMenu');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Initialize default tab (ad-display)
    tabContents.forEach(content => {
        content.style.display = content.id === 'ad-display' ? 'block' : 'none';
    });

    // Toggle navigation menu
    toggleNav.addEventListener('click', (e) => {
        e.stopPropagation();
        navMenu.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !toggleNav.contains(e.target)) {
            navMenu.classList.remove('show');
        }
    });

    // Handle tab switching
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.style.display = 'none';
            });

            // Remove active class from all links
            tabLinks.forEach(tabLink => {
                tabLink.classList.remove('active');
            });

            // Show selected tab content
            const tabId = link.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.style.display = 'block';
                // Add active class to clicked link
                link.classList.add('active');
                // Close the navigation menu
                navMenu.classList.remove('show');
            }
        });
    });

    // Handle history retention change
    const historyRetention = document.getElementById("historyRetention");
    if (historyRetention) {
        historyRetention.addEventListener("change", (e) => {
            const retention = e.target.value;
            chrome.storage.local.set({ historyRetention: retention }, () => {
                updateUI();
            });
        });
    }

    // Clear history button
    const clearHistory = document.getElementById("clearHistory");
    if (clearHistory) {
        clearHistory.addEventListener("click", () => {
            chrome.storage.local.set({ history: [] }, () => {
                updateUI();
            });
        });
    }

    // Reset all button
    const reset = document.getElementById("reset");
    if (reset) {
        reset.addEventListener("click", () => {
            chrome.storage.local.clear(() => {
                updateUI();
            });
        });
    }

    // Toggle the sidebar on click
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });
    }
});
