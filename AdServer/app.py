import logging
from flask import Flask, jsonify, request
import uuid

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(request_id)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Create a request context logger
class RequestContextAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        if not 'request_id' in kwargs.get('extra', {}):
            kwargs.setdefault('extra', {}).update({'request_id': 'N/A'})
        return msg, kwargs

logger = RequestContextAdapter(logging.getLogger(__name__), {'request_id': None})

app = Flask(__name__)

# Sample ads data
ads = {
    "technology": "Check out the latest smartphones at TechStore!",
    "sports": "Get your sports gear at SportsWorld!",
    "finance": "Invest smarter with FinTechPro!"
}

@app.before_request
def before_request():
    request_id = str(uuid.uuid4())
    logger.extra['request_id'] = request_id
    logger.info(f'Incoming {request.method} request to {request.path} - Query: {dict(request.args)}')

@app.route('/get_ad', methods=['GET'])
def get_ad():
    try:
        category = request.args.get('category')
        if not category:
            logger.warning('No category provided in request')
            return jsonify({'error': 'Category parameter is required'}), 400
            
        logger.info(f'Processing ad request for category: {category}')
        
        if category not in ads:
            logger.warning(f'Invalid category requested: {category}')
            return jsonify({'error': f'Invalid category: {category}'}), 400
            
        ad_text = ads[category]
        logger.info(f'Successfully retrieved ad for category {category}: {ad_text}')
        return jsonify({'ad': ad_text})
        
    except Exception as e:
        logger.error(f'Error processing request: {str(e)}', exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@app.after_request
def after_request(response):
    logger.info(f'Completed request with status {response.status_code}')
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
