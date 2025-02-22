async function loadModel() {
    try {
        const model = await tf.loadLayersModel(chrome.runtime.getURL('tfjs_model/model.json'));
        const response = await fetch(chrome.runtime.getURL('tokenizer.json'));
        const tokenizerData = await response.json();
        return { model, tokenizerData };
    } catch (error) {
        console.error('Error loading model:', error);
        throw error;
    }
}

async function predictInterest(text) {
    try {
        const { model, tokenizerData } = await loadModel();
        
        // Tokenize text
        let words = text.toLowerCase().split(/\s+/);
        // Pad or truncate to match input shape (6 tokens)
        let sequences = words.slice(0, 6);
        while (sequences.length < 6) {
            sequences.push('');  // Pad with empty strings
        }
        
        // Convert words to token ids
        sequences = sequences.map(word => tokenizerData[word] || 0);
        
        // Create tensor with proper shape [1, 6]
        let inputTensor = tf.tensor2d([sequences], [1, 6]);

        // Predict
        const prediction = await model.predict(inputTensor);
        const probabilities = await prediction.data();
        const categoryIndex = probabilities.indexOf(Math.max(...probabilities));
        
        // Cleanup
        inputTensor.dispose();
        prediction.dispose();
        
        // Map index to category
        const categories = ["technology", "finance", "sports"];
        return categories[categoryIndex] || "general";
    } catch (error) {
        console.error('Error during prediction:', error);
        return "general";  // fallback category
    }
}
