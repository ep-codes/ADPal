import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv
import json
import re

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

import requests

@app.get("/get_ad")
async def get_ad(category: Optional[str] = Query(None, description="Category for the ad"),
                accept: Optional[str] = Query(None, alias="Accept")):
    """
    Generate an AI image for a specific category or default prompt
    """
    try:
        # Get category-specific prompt or use default
        # Generate llm prompt

        inputs = [
            { "role": "system", "content": "You are a ad creator that comes up with short picture ad concepts 10 words max only output json" },
            { "role": "user", "content": f"Write a ad about {category} give a tagline and a image generation prompt in json format. The json should have a 'prompt' key for the image generation prompt and a 'text' key for the tagline." },
        ]

        input = { "messages": inputs }
        response = requests.post(
            f"{CLOUDFLARE_BASE_URL}/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct",
            headers={"Authorization": f"Bearer {CLOUDFLARE_API_KEY}"},
            json=input
        )

        raw_output = response.json()
        raw_output= raw_output['result']['response']
        match = re.search(r'\{.*\}', raw_output, re.DOTALL)

        if match:
            json_content = match.group(0)  # Extract matched JSON
            ad_data = json.loads(json_content)

        logger.info(f"Generating ad for category: {category}")
        logger.info(f"Ad prompt: {ad_data['prompt']}")
        logger.info(f"Ad text: {ad_data['text']}")

        # If client wants JSON, return without generating image
        if accept and "application/json" in accept.lower():
            return JSONResponse(content={
                "ad": "No ad",
                "prompt": ad_data["prompt"]
            })

        # Generate image
        inputs = {
            "prompt": ad_data["prompt"],
            "negative_prompt": "no blur, no distortion, no text",
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
