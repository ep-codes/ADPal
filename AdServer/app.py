import httpx
from fastapi import FastAPI, HTTPException
import logging
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration
CLOUDFLARE_API_KEY = os.getenv("API_TOKEN")
CLOUDFLARE_ACCOUNT_ID = os.getenv("ACCOUNT_ID")
CLOUDFLARE_BASE_URL = "https://api.cloudflare.com/client/v4/accounts"

async def run(model: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run a model inference through Cloudflare's AI API
    
    Args:
        model (str): The model identifier
        inputs (Dict[str, Any]): The input parameters for the model
        
    Returns:
        Dict[str, Any]: The model's response
        
    Raises:
        HTTPException: If any error occurs during the API call
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
                timeout=30.0  # Add explicit timeout
            )
            
            # Check if the response was successful
            response.raise_for_status()
            return response.json()
            
    except httpx.TimeoutException as e:
        logger.error(f"Timeout error: {e}")
        raise HTTPException(
            status_code=504,
            detail="Request to Cloudflare API timed out"
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error: {e}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Cloudflare API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"Request error: {e}")
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Cloudflare API"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

from fastapi.responses import Response

@app.get("/get_ad")
async def get_ad():
    """
    Generate an AI image using Stable Diffusion XL

    Returns:
        Response: The generated image data
    """
    inputs = {
        "prompt": "llama that goes on a journey to find an orange cloud",
        "negative_prompt": "no rain, no dark clouds",
        "height": 512,
        "width": 512,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CLOUDFLARE_BASE_URL}/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0",
                headers={"Authorization": f"Bearer {CLOUDFLARE_API_KEY}"},
                json=inputs,
                timeout=30.0
            )
            response.raise_for_status()
            image_data = response.content  # Get raw image data

            return Response(content=image_data, media_type="image/png")  # Or image/jpeg
    except httpx.TimeoutException as e:
        logger.error(f"Timeout error: {e}")
        raise HTTPException(
            status_code=504,
            detail="Request to Cloudflare API timed out"
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error: {e}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Cloudflare API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"Request error: {e}")
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Cloudflare API"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
