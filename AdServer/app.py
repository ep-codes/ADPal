from fastapi import FastAPI, HTTPException, Query, Header, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import logging
from typing import Optional
import os
from dotenv import load_dotenv
import time
from collections import defaultdict

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
CLOUDFLARE_API_KEY = os.getenv("API_TOKEN")
CLOUDFLARE_ACCOUNT_ID = os.getenv("ACCOUNT_ID")
CLOUDFLARE_BASE_URL = "https://api.cloudflare.com/client/v4/accounts"

# Rate limiting settings
RATE_LIMIT_SECONDS = 5  # Time window in seconds
MAX_REQUESTS = 1  # Maximum requests per time window
request_history = defaultdict(list)  # Store request timestamps per IP

# Sample ads data
ads = {
    "technology": {
        "prompt": "futuristic smartphone with holographic display in a modern setting",
        "text": "Check out the latest smartphones at TechStore!"
    },
    "sports": {
        "prompt": "dynamic sports equipment with energy trails in a stadium",
        "text": "Get your sports gear at SportsWorld!"
    },
    "finance": {
        "prompt": "professional looking charts and graphs with upward trends",
        "text": "Invest smarter with FinTechPro!"
    }
}

def check_rate_limit(ip: str) -> bool:
    """Check if request is within rate limits"""
    now = time.time()
    request_history[ip] = [t for t in request_history[ip] if now - t < RATE_LIMIT_SECONDS]
    
    if len(request_history[ip]) >= MAX_REQUESTS:
        return False
        
    request_history[ip].append(now)
    return True

@app.get("/get_ad")
async def get_ad(
    request: Request,
    category: Optional[str] = Query(None, description="Category for the ad")
):
    """
    Generate an AI image for a specific category or default prompt
    """
    client_ip = request.client.host
    
    # Check rate limit
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a few seconds before trying again.",
            headers={"Retry-After": str(RATE_LIMIT_SECONDS)}
        )
    
    try:
        # Get category-specific prompt or use default
        ad_data = ads.get(category, {
            "prompt": "llama that goes on a journey to find an orange cloud",
            "text": "Discover amazing products!"
        })

        # Generate image
        inputs = {
            "prompt": ad_data["prompt"],
            "negative_prompt": "no rain, no dark clouds, no blur, no distortion",
            "height": 512,
            "width": 512,
        }

        logger.info(f"Generating ad for category: {category}")
        logger.info(f"Using prompt: {inputs['prompt']}")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CLOUDFLARE_BASE_URL}/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0",
                headers={"Authorization": f"Bearer {CLOUDFLARE_API_KEY}"},
                json=inputs,
                timeout=30.0
            )
            response.raise_for_status()
            
            # Return the image
            return Response(
                content=response.content,
                media_type="image/png",
                headers={
                    "Content-Type": "image/png",
                    "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                    "X-RateLimit-Limit": str(MAX_REQUESTS),
                    "X-RateLimit-Remaining": str(MAX_REQUESTS - len(request_history[client_ip])),
                    "X-RateLimit-Reset": str(int(time.time() + RATE_LIMIT_SECONDS))
                }
            )

    except httpx.TimeoutException as e:
        logger.error(f"Timeout error: {e}")
        raise HTTPException(status_code=504, detail="Request to Cloudflare API timed out")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error: {e}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Cloudflare API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"Request error: {e}")
        raise HTTPException(status_code=502, detail="Could not connect to Cloudflare API")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
