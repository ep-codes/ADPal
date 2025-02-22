// Add a new object to track topic frequencies
const topicFrequencies = {};

// History management
function addToHistory(category, adText) {
    const timestamp = Date.now();
    chrome.storage.local.get(['history', 'historyRetention'], (data) => {
        let history = data.history || [];
        const retention = data.historyRetention || 'month'; // default to month
        
        // Add new entry
        history.push({ category, adText, timestamp });
        
        // Clean old entries based on retention setting
        const now = Date.now();
        const retentionPeriods = {
            'week': 7 * 24 * 60 * 60 * 1000,
            'month': 30 * 24 * 60 * 60 * 1000,
            'year': 365 * 24 * 60 * 60 * 1000
        };
        
        history = history.filter(entry => {
            return (now - entry.timestamp) <= retentionPeriods[retention];
        });
        
        // Update weights based on history
        updateAdWeights(history);
        
        // Save updated history and notify any open popups
        chrome.storage.local.set({ history }, () => {
            notifyUIUpdate();
        });
    });
}

// Safely notify any open popup windows to update their UI
function notifyUIUpdate() {
    chrome.runtime.sendMessage({ action: 'updateUI' }).catch(() => {
        // Ignore errors when popup is not open
    });
}

// Update ad weights based on user history and topic frequency
function updateAdWeights(history) {
    // Analyze last 24 hours of history
    const recent = history.filter(entry => {
        return (Date.now() - entry.timestamp) <= 24 * 60 * 60 * 1000;
    });
    
    // Count category frequencies
    const categoryFreq = {};
    recent.forEach(entry => {
        categoryFreq[entry.category] = (categoryFreq[entry.category] || 0) + 1;
        topicFrequencies[entry.category] = (topicFrequencies[entry.category] || 0) + 1;
    });
}

// Function to fetch ad from the ad server
function fetchAd(category) {
    fetch(`http://localhost:3000/get_ad?category=${category}`)
        .then(response => response.json())
        .then(data => {
            const adText = data.ad;
            console.log(`Fetched ad: ${adText}`);
            // Update current ad and add to history
            chrome.storage.local.set({ "currentAd": adText }, () => {
                addToHistory(category, adText);
            });
        })
        .catch(error => {
            console.error('Error fetching ad:', error);
            // Store the error state
            chrome.storage.local.set({ 
                "currentAd": "Error loading ad. Please try again.",
                "lastError": error.message
            }, () => {
                notifyUIUpdate();
            });
        });
}

// Listen for messages from content.js or popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.category) {
        fetchAd(message.category);
        // Must return false since we're not using sendResponse
        return false;
    }
});

// Example usage: Fetch an ad for technology category
// fetchAd('technology');
