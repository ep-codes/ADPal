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
// chrome.runtime.sendMessage({ category: interest });
