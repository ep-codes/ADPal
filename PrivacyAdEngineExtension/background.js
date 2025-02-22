// Add a new object to track topic frequencies
const topicFrequencies = {};

// History management
function addToHistory(category, adContent) {
    const timestamp = Date.now();
    chrome.storage.local.get(['history', 'historyRetention'], (data) => {
        let history = data.history || [];
        const retention = data.historyRetention || 'month'; // default to month
        
        // Add new entry
        history.push({ 
            category, 
            adContent,
            timestamp 
        });
        
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
async function fetchAd(category) {
    try {
        // First get the ad text
        const textResponse = await fetch(`http://localhost:3000/get_ad?category=${category}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!textResponse.ok) {
            throw new Error(`Failed to fetch ad text: ${textResponse.status}`);
        }

        const textData = await textResponse.json();
        console.log('Received ad text:', textData);

        // Then get the image
        const imageResponse = await fetch(`http://localhost:3000/get_ad?category=${category}`, {
            headers: {
                'Accept': 'image/png'
            }
        });

        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }

        const blob = await imageResponse.blob();
        const imageUrl = URL.createObjectURL(blob);
        console.log('Created image URL:', imageUrl);
            
        // Store both image and text
        const adContent = {
            image: imageUrl,
            text: textData.ad,
            prompt: textData.prompt
        };
            
        console.log('Storing ad content:', adContent);
            
        // Update storage with both image and text
        chrome.storage.local.set({ 
            "currentAd": adContent,
            "lastError": null
        }, () => {
            addToHistory(category, adContent);
            notifyUIUpdate();
        });
    } catch (error) {
        console.error('Error fetching ad:', error);
        console.error('Error stack:', error.stack);
        
        // Store the error state
        chrome.storage.local.set({
            "currentAd": {
                text: "Error loading ad. Please try again.",
                image: null,
                prompt: null
            },
            "lastError": error.message
        }, () => {
            notifyUIUpdate();
        });
    }
}

// Listen for messages from content.js or popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.category) {
        fetchAd(message.category);
        // Must return false since we're not using sendResponse
        return false;
    }
});
