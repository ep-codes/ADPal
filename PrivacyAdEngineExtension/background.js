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

// Function to convert Blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Function to fetch ad from the ad server
async function fetchAd(category) {
    try {
        // Set loading state
        chrome.storage.local.set({ 
            "isLoading": true,
            "currentAd": null,
            "lastError": null
        }, () => {
            notifyUIUpdate();
        });

        // Get the image ad
        const response = await fetch(`http://localhost:3000/get_ad?category=${category}`, {
            headers: {
                'Accept': 'image/*'
            }
        });

        if (!response.ok) {
            const retryAfter = response.headers.get('Retry-After');
            if (response.status === 429 && retryAfter) {
                throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
            }
            throw new Error(`Failed to fetch ad: ${response.status}`);
        }

        const imageBlob = await response.blob();
        const base64Image = await blobToBase64(imageBlob);
        console.log('Converted image to base64');
            
        // Store the image
        const adContent = {
            image: base64Image,
            text: "Check out this amazing product!", // Default text
            prompt: category || "default" // Use category as prompt or "default"
        };
            
        console.log('Storing ad content:', adContent);
            
        // Update storage with image and clear loading state
        chrome.storage.local.set({ 
            "currentAd": adContent,
            "lastError": null,
            "isLoading": false
        }, () => {
            addToHistory(category, adContent);
            notifyUIUpdate();
        });
    } catch (error) {
        console.error('Error fetching ad:', error);
        console.error('Error stack:', error.stack);
        
        // Store the error state and clear loading state
        chrome.storage.local.set({
            "currentAd": {
                text: error.message || "Error loading ad. Please try again.",
                image: null,
                prompt: null
            },
            "lastError": error.message,
            "isLoading": false
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
