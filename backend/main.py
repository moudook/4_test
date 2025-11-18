from fastapi import FastAPI
import uvicorn

from app.config.configloader import load_config
load_config(".env")

from app.routers.meetingRouter import router as meeting_router
from app.routers.applications_router import router as applications_router
from app.routers.startups_router import router as startups_router
import os
import logging

logger = logging.getLogger(__name__)
app = FastAPI()
app.include_router(meeting_router, tags=["Meetings"])
app.include_router(applications_router, tags=["Applications"])
app.include_router(startups_router, tags=["Startups"])

@app.get("/")
async def read_root():
    logger.debug("Root endpoint hit.")
    return {"Hello": "World"}

if __name__ == "__main__":
    load_config(".env")
    host = os.getenv("SERVER_HOST", "127.0.0.1")
    port = int(os.getenv("SERVER_PORT", "8000"))
    logger.info(f"Starting FastAPI server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
