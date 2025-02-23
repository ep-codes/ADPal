// Extract text from the page
function extractText() {
    let text = document.body.innerText;
    return text.replace(/\s+/g, ' ').trim();
}

// Basic keyword-based interest mapping
function inferInterest(text) {
    const keywords = {
        "Business": ["economy", "markets", "stocks", "entrepreneurship", "finance", "trade", "mergers", "banking", "corporate", "investments", "startups", "real estate", "venture capital", "cryptocurrency", "business strategy", "marketing", "e-commerce", "retail", "consumer behavior", "leadership", "innovation", "taxation", "financial planning", "logistics", "supply chain"],
        "Tech": ["github","technology", "AI", "smartphone", "laptop", "blockchain", "robotics", "biotech", "quantum computing", "cybersecurity", "space exploration", "machine learning", "nanotechnology", "5G", "automation", "big data", "cloud computing", "data science", "biometrics", "smart devices", "augmented reality", "virtual reality", "software engineering", "wearables", "green tech"],
        "Entertainment": ["movies", "TV shows", "celebrities", "Hollywood", "Bollywood", "music", "streaming", "theater", "comedy", "awards", "candy", "gaming", "Netflix", "film festivals", "Oscars", "stand-up comedy", "Broadway", "documentaries", "K-pop", "reality TV", "viral videos", "cinematography", "film industry", "directors", "actors"],
        "Sports": ["football", "soccer", "basketball", "tennis", "baseball", "hockey", "golf", "MMA", "cricket", "Olympics", "athletics", "Formula 1", "NFL", "NBA", "esports", "rugby", "swimming", "boxing", "cycling", "motorsports", "gymnastics", "marathons", "extreme sports", "skating"],
        "Politics": ["politics", "elections", "economy", "policy", "crime", "society", "education", "immigration", "supreme court", "local news", "legislation", "diplomacy", "government", "political debates", "foreign policy", "lobbying", "senate", "congress", "human rights", "campaigns", "democracy", "public opinion", "law enforcement", "corruption"],
        "World": ["geopolitics", "diplomacy", "war", "international relations", "trade", "human rights", "global economy", "climate change", "UN", "foreign affairs", "terrorism", "peace talks", "humanitarian aid", "geostrategy", "sanctions", "world leaders", "border disputes", "treaties", "global conflicts", "economic alliances", "international law", "refugees", "foreign aid"],
        "Health": ["medicine", "nutrition", "fitness", "mental health", "pandemics", "vaccines", "hospitals", "diseases", "public health", "wellness", "diet", "alternative medicine", "pharmaceuticals", "healthcare policies", "meditation", "yoga", "cardiology", "neurology", "cancer research", "epidemics", "telemedicine", "exercise", "genetics", "well-being"],
        "Top News": ["breaking news", "headlines", "trending", "major events", "world leaders", "elections", "emergency", "government", "laws", "public opinion", "natural disasters", "crime", "war updates", "protests", "viral stories", "media coverage", "celebrity scandals", "economic shifts", "disasters", "press conferences"],
        "European Affairs": ["EU", "Brexit", "France", "Germany", "UK", "Spain", "Italy", "NATO", "European economy", "politics", "Eurozone", "European Parliament", "Schengen", "migrants", "refugee crisis", "euro currency", "diplomatic relations", "trade agreements", "European Commission", "border control", "inflation", "employment"],
        "Foreign Affairs": ["Rome", "Milan", "Vatican", "Italian politics", "culture", "fashion", "Serie A", "Italian economy", "tourism", "gastronomy", "international trade", "diplomatic relations", "embassies", "Italian history", "architecture", "UNESCO sites", "Italian cuisine", "exports", "Italy-France relations"],
        "Software and Development": ["coding", "programming", "JavaScript", "Python", "frameworks", "open-source", "cloud computing", "DevOps", "software engineering", "AI development", "frontend", "backend", "databases", "blockchain development", "cybersecurity", "mobile development", "machine learning", "algorithms", "data structures", "API design", "web development"],
        "Animals": ["wildlife", "pets", "conservation", "endangered species", "dog breeds", "cat breeds", "marine life", "birds", "insects", "zoology", "veterinary medicine", "animal rescue", "sanctuaries", "extinction", "habitats", "exotic pets", "animal behavior", "dog training", "evolution", "national parks", "ocean life", "animal documentaries"],
        "Music": ["pop", "rock", "hip-hop", "EDM", "jazz", "classical", "concerts", "albums", "Grammy", "music industry", "festivals", "streaming platforms", "indie music", "record labels", "billboard charts", "soundtracks", "musical instruments", "concert tours", "K-pop", "country music", "folk"],
        "Toons": ["cartoons", "animation", "anime", "Disney", "Pixar", "manga", "comics", "superheroes", "Netflix animation", "voice acting", "graphic novels", "CGI animation", "animated series", "cartoon network", "Nickelodeon", "Looney Tunes", "classic animation", "stop motion"],
        "Fashion": ["trends", "designer brands", "haute couture", "streetwear", "runway shows", "fast fashion", "sustainable fashion", "fashion week", "celebrity style", "luxury fashion", "handbags", "shoes", "accessories", "vintage fashion", "fashion influencers"],
        "Automotive": ["cars", "electric vehicles", "hybrid cars", "car reviews", "automakers", "motorsports", "Formula 1", "car maintenance", "autonomous driving", "supercars", "automobile industry", "car technology", "EV charging", "road safety", "self-driving cars", "car interiors"],
        "Gaming": ["PC gaming", "console gaming", "PlayStation", "Xbox", "Nintendo", "esports", "streaming", "Twitch", "game reviews", "VR gaming", "indie games", "mobile gaming", "game development", "retro gaming"],
        "Food": ["recipes", "cooking", "restaurants", "fine dining", "fast food", "vegan", "desserts", "wine", "food festivals", "nutrition", "Michelin-starred chefs", "street food", "gourmet cuisine", "food influencers"],
        "Travel": ["destinations", "adventure", "hotels", "air travel", "road trips", "beaches", "mountains", "budget travel", "luxury travel", "travel guides", "visa regulations", "backpacking", "cruises", "travel tips"],
        "Cryptocurrency": ["Bitcoin", "Ethereum", "altcoins", "blockchain", "NFTs", "crypto trading", "decentralized finance", "crypto mining", "Web3", "metaverse", "stablecoins", "crypto wallets"]
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
