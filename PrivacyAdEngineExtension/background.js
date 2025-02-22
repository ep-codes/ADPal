// Sample ads for different categories with weights
const ads = {
    "technology": [
        { text: "Check out the latest smartphones at TechStore!", weight: 1 },
        { text: "Discover cutting-edge laptops at TechStore!", weight: 1 },
        { text: "Explore smart home devices at TechStore!", weight: 1 }
    ],
    "sports": [
        { text: "Get your sports gear at SportsWorld!", weight: 1 },
        { text: "Premium fitness equipment at SportsWorld!", weight: 1 },
        { text: "Athletic wear collection at SportsWorld!", weight: 1 }
    ],
    "finance": [
        { text: "Invest smarter with FinTechPro!", weight: 1 },
        { text: "Secure your future with FinTechPro!", weight: 1 },
        { text: "Expert financial advice at FinTechPro!", weight: 1 }
    ]
};

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
    // Reset weights
    Object.keys(ads).forEach(category => {
        ads[category].forEach(ad => ad.weight = 1);
    });
    
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
    
    // Adjust weights based on frequency
    Object.keys(categoryFreq).forEach(category => {
        if (ads[category]) {
            ads[category].forEach(ad => {
                // Increase weight based on overall topic frequency
                ad.weight += topicFrequencies[category] || 0; // Add frequency weight
                ad.weight = Math.max(1, ad.weight); // Ensure minimum weight
            });
        }
    });
}

// Select an ad based on weights
function selectAd(category) {
    if (!ads[category]) return "Discover amazing products!";
    
    const categoryAds = ads[category];
    const totalWeight = categoryAds.reduce((sum, ad) => sum + ad.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const ad of categoryAds) {
        random -= ad.weight;
        if (random <= 0) return ad.text;
    }
    
    return categoryAds[0].text;
}

// Function to fetch ad from the ad server
function fetchAd(category) {
    fetch(`http://localhost:3000/get_ad?category=${category}`)  // Update with the correct server URL
        .then(response => response.json())
        .then(data => {
            const adText = data.ad;
            console.log(`Fetched ad: ${adText}`);  // Log the fetched ad
            chrome.storage.local.set({ "currentAd": adText });  // Store the ad
        })
        .catch(error => {
            console.error('Error fetching ad:', error);
        });
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.category) {
        if (message.fetchAd) {
            fetchAd(message.category);
        } else {
            let adText = selectAd(message.category);
            chrome.storage.local.set({ "currentAd": adText });
            addToHistory(message.category, adText);
        }
    }
});

// Example usage: Fetch an ad for technology category
fetchAd('technology');
