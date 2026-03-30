"""
FOMO Arena Backend Proxy
FastAPI proxy that forwards requests to NestJS backend.
"""

import os
import subprocess
import asyncio
import sys
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

app = FastAPI(title="FOMO Arena API Proxy")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NestJS backend URL
NEST_URL = "http://localhost:4001"
nest_process = None

@app.on_event("startup")
async def startup_event():
    """Start NestJS backend on startup"""
    global nest_process
    
    # Load .env file if exists
    env_file = "/app/backend/.env"
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
    
    env = os.environ.copy()
    env["PORT"] = "4001"
    env["MONGO_URL"] = os.environ.get("MONGO_URL", "mongodb://localhost:27017/fomo_arena")
    env["DB_NAME"] = os.environ.get("DB_NAME", "fomo_arena")
    env["JWT_SECRET"] = os.environ.get("JWT_SECRET", "fomo-arena-secret-key-2026")
    env["ARENA_ONCHAIN_ENABLED"] = os.environ.get("ARENA_ONCHAIN_ENABLED", "true")
    env["CHAIN_RPC"] = os.environ.get("CHAIN_RPC", "https://bsc-testnet.publicnode.com")
    env["CHAIN_ID"] = os.environ.get("CHAIN_ID", "97")
    env["PREDICTION_CONTRACT"] = os.environ.get("PREDICTION_CONTRACT", "0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e")
    env["ARENA_CORE_ADDRESS"] = os.environ.get("ARENA_CORE_ADDRESS", "0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e")
    env["ARENA_COLLATERAL_ADDRESS"] = os.environ.get("ARENA_COLLATERAL_ADDRESS", "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948")
    
    # Start NestJS using local ts-node
    nest_process = subprocess.Popen(
        ["./node_modules/.bin/ts-node", "-r", "tsconfig-paths/register", "src/main.ts"],
        cwd="/app/backend",
        env=env,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    # Wait for NestJS to start
    await asyncio.sleep(10)
    print("🚀 NestJS backend started on port 4001")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop NestJS backend on shutdown"""
    global nest_process
    if nest_process:
        nest_process.terminate()
        try:
            nest_process.wait(timeout=5)
        except:
            nest_process.kill()

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "fomo-arena"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "FOMO Arena API", "docs": "/api/docs"}

# Proxy all other requests to NestJS
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(request: Request, path: str):
    """Proxy requests to NestJS backend"""
    try:
        async with httpx.AsyncClient() as client:
            # NestJS routes have /api prefix
            url = f"{NEST_URL}/api/{path}"
            
            headers = dict(request.headers)
            headers.pop("host", None)
            
            body = await request.body()
            
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=request.query_params,
                timeout=30.0
            )
            
            # Remove headers that cause issues
            resp_headers = dict(response.headers)
            resp_headers.pop("transfer-encoding", None)
            resp_headers.pop("content-encoding", None)
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=resp_headers,
                media_type=response.headers.get("content-type")
            )
    except httpx.ConnectError:
        return JSONResponse(
            status_code=503,
            content={"error": "Backend service unavailable", "detail": "NestJS backend is starting up..."}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "Proxy error", "detail": str(e)}
        )
