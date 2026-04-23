from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routes import simulation, persona

import os

app = FastAPI(title="CGE Policy Simulation API", version="1.0.0")

# Configure origins for CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173,http://localhost:3000")
origins = [origin.strip() for origin in frontend_url.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation.router, prefix="")
app.include_router(persona.router, prefix="/api/persona", tags=["persona"])

@app.get("/health")
def health():
    return {"status": "ok", "engine": "LENS-V4-CAUSAL"}
