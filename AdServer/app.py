import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Configuration
CLOUDFLARE_API_KEY = os.getenv("API_TOKEN")
CLOUDFLARE_ACCOUNT_ID = os.getenv("ACCOUNT_ID")
CLOUDFLARE_BASE_URL = "https://api.cloudflare.com/client/v4/accounts"

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

async def run(model: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run a model inference through Cloudflare's AI API
    """
    if not CLOUDFLARE_API_KEY or not CLOUDFLARE_ACCOUNT_ID:
        raise HTTPException(
            status_code=500,
            detail="Cloudflare API key or Account ID not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CLOUDFLARE_BASE_URL}/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model}",
                headers={"Authorization": f"Bearer {CLOUDFLARE_API_KEY}"},
                json=inputs,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
            
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

@app.get("/get_ad")
async def get_ad(category: Optional[str] = Query(None, description="Category for the ad"),
                accept: Optional[str] = Query(None, alias="Accept")):
    """
    Generate an AI image for a specific category or default prompt
    """
    try:
        # Get category-specific prompt or use default
        ad_data = ads.get(category, {
            "prompt": "llama that goes on a journey to find an orange cloud",
            "text": "Discover amazing products!"
        })

        # If client wants JSON, return without generating image
        if accept and "application/json" in accept.lower():
            return JSONResponse(content={
                "ad": ad_data["text"],
                "prompt": ad_data["prompt"]
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
                headers={"Content-Type": "image/png"}
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
