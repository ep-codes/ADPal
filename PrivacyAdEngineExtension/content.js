// Extract text from the page
function extractText() {
    let text = document.body.innerText;
    return text.replace(/\s+/g, ' ').trim();
}

// Basic keyword-based interest mapping
function inferInterest(text) {
    const keywords = {
        "Business": ["economy", "markets", "stocks", "entrepreneurship", "finance", "trade", "mergers", "banking", "corporate", "investments"],
        "Sci/Tech": ["AI", "smartphone", "laptop", "blockchain", "robotics", "biotech", "quantum computing", "cybersecurity", "space exploration", "machine learning"],
        "Entertainment": ["movies", "TV shows", "celebrities", "Hollywood", "Bollywood", "music", "streaming", "theater", "comedy", "awards"],
        "Sports": ["football", "soccer", "basketball", "tennis", "baseball", "hockey", "golf", "MMA", "cricket", "Olympics"],
        "U.S.": ["politics", "elections", "economy", "policy", "crime", "society", "education", "immigration", "supreme court", "local news"],
        "World": ["geopolitics", "diplomacy", "war", "international relations", "trade", "human rights", "global economy", "climate change", "UN", "foreign affairs"],
        "Health": ["medicine", "nutrition", "fitness", "mental health", "pandemics", "vaccines", "hospitals", "diseases", "public health", "wellness"],
        "Top News": ["breaking news", "headlines", "trending", "major events", "world leaders", "elections", "emergency", "government", "laws", "public opinion"],
        "Europe": ["EU", "Brexit", "France", "Germany", "UK", "Spain", "Italy", "NATO", "European economy", "politics"],
        "Italia": ["Rome", "Milan", "Vatican", "Italian politics", "culture", "fashion", "Serie A", "Italian economy", "tourism", "gastronomy"],
        "Software and Development": ["coding", "programming", "JavaScript", "Python", "frameworks", "open-source", "cloud computing", "DevOps", "software engineering", "AI development"],
        "Music Feeds": ["pop", "rock", "hip-hop", "EDM", "jazz", "classical", "concerts", "albums", "Grammy", "music industry"],
        "Toons": ["cartoons", "animation", "anime", "Disney", "Pixar", "manga", "comics", "superheroes", "Netflix animation", "voice acting"],
        "General": ["trending topics", "culture", "lifestyle", "internet", "memes", "viral content", "science", "technology", "history", "education"]
    };

    for (const category in keywords) {
        if (keywords[category].some(word => text.includes(word))) {
            return category;
        }
    }
    return "general";
}

// Send inferred interest to the background script
let pageText = extractText();
let interest = inferInterest(pageText);
chrome.runtime.sendMessage({ category: interest });

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateUI') {
        chrome.storage.local.get(["currentAd"], (data) => {
            let currentAd = data.currentAd;
            if (currentAd && typeof currentAd === 'object' && currentAd.image && currentAd.image.startsWith('blob:')) {
                // Create an image element
                let img = document.createElement('img');
                img.src = currentAd.image;
                img.style.width = '200px';
                img.style.height = '200px';
                img.style.position = 'fixed';
                img.style.top = '10px';
                img.style.right = '10px';
                img.style.zIndex = '10000';

                // Append the image to the body
                document.body.appendChild(img);
            } else if (currentAd && typeof currentAd === 'object' && currentAd.text) {
                // Display the ad text
                alert(currentAd.text);
            } else {
                alert("Error loading ad. Please try again.");
            }
        });
    }
});
