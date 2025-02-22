// Update UI with current data
function updateUI() {
    chrome.storage.local.get(['currentAd', 'history', 'historyRetention', 'lastError'], (data) => {
        // Update current ad
        const adElement = document.getElementById("adText");
        adElement.innerText = data.currentAd || "No ad selected";
        if (data.lastError) {
            adElement.classList.add('error');
            console.error('Last error:', data.lastError);
        } else {
            adElement.classList.remove('error');
        }
        
        // Update history retention dropdown
        const retention = data.historyRetention || 'month';
        document.getElementById("historyRetention").value = retention;
        
        // Update history list
        const historyList = document.getElementById("historyList");
        historyList.innerHTML = '';
        
        if (data.history && data.history.length > 0) {
            const recentHistory = data.history.slice(-5).reverse(); // Show last 5 entries
            recentHistory.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'history-item';
                const date = new Date(entry.timestamp);
                item.innerHTML = `
                    <span class="history-category">${entry.category}</span>
                    <span class="history-date">${date.toLocaleDateString()}</span>
                    <span class="history-ad">${entry.adText}</span>
                `;
                historyList.appendChild(item);
            });
        } else {
            historyList.innerHTML = '<p>No history available</p>';
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
document.addEventListener('DOMContentLoaded', updateUI);

// Handle history retention change
document.getElementById("historyRetention").addEventListener("change", (e) => {
    const retention = e.target.value;
    chrome.storage.local.set({ historyRetention: retention }, () => {
        updateUI();
    });
});

// Clear history button
document.getElementById("clearHistory").addEventListener("click", () => {
    chrome.storage.local.set({ history: [] }, () => {
        updateUI();
    });
});

// Reset all button (clear everything)
document.getElementById("reset").addEventListener("click", () => {
    chrome.storage.local.clear(() => {
        updateUI();
    });
});

// Tab switching functionality
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links and hide all content
        tabLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(c => c.style.display = 'none');
        
        // Add active class to clicked link and show corresponding content
        link.classList.add('active');
        const tabId = link.getAttribute('data-tab');
        document.getElementById(tabId).style.display = 'block';
    });
});

// Toggle sidebar visibility
const toggleButton = document.getElementById('toggleSidebar');
toggleButton.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
    const content = document.querySelector('.content');
    content.style.marginLeft = sidebar.classList.contains('collapsed') ? '0' : '200px';
});
