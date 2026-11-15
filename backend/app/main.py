import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .config import settings
from .database import engine, Base
from .routers import menu, orders, pulse, serendipity, chat

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="The Café Companion API",
    description="Dual-Pulse AI Café Experience powered by Google Cloud & Gemini",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(pulse.router)
app.include_router(serendipity.router)
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "gcp_project_id": settings.GCP_PROJECT_ID,
        "gemini_active": bool(settings.GEMINI_API_KEY)
    }

# Serve frontend build in production if available
candidate_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    "/frontend/dist",
    "/app/frontend/dist",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
]
frontend_dist = next((p for p in candidate_paths if os.path.exists(p)), None)

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
