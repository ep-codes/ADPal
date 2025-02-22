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
        
        // Save updated history
        chrome.storage.local.set({ history });
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
        topicFrequencies[entry.category] = (topicFrequencies[entry.category] || 0) + 1; // Track overall topic frequency
    });
}

// Function to opt out of a topic
function optOutTopic(topic) {
    chrome.storage.local.get(['optedOutTopics'], (data) => {
        let optedOutTopics = data.optedOutTopics || [];
        if (!optedOutTopics.includes(topic)) {
            optedOutTopics.push(topic);
            chrome.storage.local.set({ optedOutTopics: optedOutTopics }, () => {
                console.log(`Opted out of topic: ${topic}`);
            });
        }
    });
}

// Function to check if a topic is opted out
function isOptedOut(topic, callback) {
    chrome.storage.local.get(['optedOutTopics'], (data) => {
        const optedOutTopics = data.optedOutTopics || [];
        callback(optedOutTopics.includes(topic));
    });
}

// Function to fetch ad from the ad server
function fetchAd(category) {
    isOptedOut(category, (optedOut) => {
        if (optedOut) {
            console.log(`Skipping ad fetch for opted-out category: ${category}`);
            return;
        }
        fetch(`http://localhost:3000/get_ad?category=${category}`)
            .then(response => response.json())
            .then(data => {
                const adText = data.ad;
                console.log(`Fetched ad: ${adText}`);
                chrome.storage.local.set({ "currentAd": adText });
            })
            .catch(error => {
                console.error('Error fetching ad:', error);
            });
    });
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.category) {
        if (message.fetchAd) {
            fetchAd(message.category);
        } else {
            chrome.storage.local.get(['currentAd'], (data) => {
                const adText = data.currentAd;
                chrome.storage.local.set({ "currentAd": adText });
                addToHistory(message.category, adText);
            });
        }
    }
});

// Example usage: Fetch an ad for technology category
fetchAd('technology');
