import logging
from flask import Flask, jsonify, request

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

# Sample ads data
ads = {
    "technology": "Check out the latest smartphones at TechStore!",
    "sports": "Get your sports gear at SportsWorld!",
    "finance": "Invest smarter with FinTechPro!"
}

@app.route('/get_ad', methods=['GET'])
def get_ad():
    category = request.args.get('category')
    logging.info(f'Received request for category: {category}')  # Log the incoming request
    ad_text = ads.get(category, "Discover amazing products!")
    logging.info(f'Returning ad: {ad_text}')  # Log the response
    return jsonify({'ad': ad_text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
