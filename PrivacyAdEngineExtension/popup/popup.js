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
