// Extract text from the page
function extractText() {
    let text = document.body.innerText;
    return text.replace(/\s+/g, ' ').trim();
}

// Basic keyword-based interest mapping
function inferInterest(text) {
    const keywords = {
        "technology": ["AI", "smartphone", "laptop", "blockchain"],
        "sports": ["football", "soccer", "basketball", "tennis"],
        "finance": ["stocks", "crypto", "investment", "trading"]
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
