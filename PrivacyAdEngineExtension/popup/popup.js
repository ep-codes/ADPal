// Update UI with current data
function updateUI() {
    chrome.storage.local.get(['currentAd', 'history', 'historyRetention'], (data) => {
        // Update current ad
        document.getElementById("adText").innerText = data.currentAd || "No ad selected";
        
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

// Initialize UI
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

// Handle Save Preferences button click
document.getElementById('saveOptOut').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.opt-out-checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            optOutTopic(checkbox.value);  // Call optOutTopic for each selected checkbox
        }
    });
    alert('Your preferences have been saved!');
});

// Tab switching functionality
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

tabLinks.forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default anchor behavior
        const targetTab = this.dataset.tab;
        
        // Hide all tab contents
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Remove active class from all links
        tabLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Show the selected tab content
        document.getElementById(targetTab).style.display = 'block';
        this.classList.add('active');
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
