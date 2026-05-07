#!/usr/bin/env python3
"""
ALEXVERSE Scheduler & Job Runner
Executes periodic tasks and simulation ticks
"""

import os
import asyncio
import logging
from datetime import datetime
from typing import Optional
import json

import httpx
import uvicorn
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")
LIFE_ENGINE_URL = os.getenv("LIFE_ENGINE_URL", "http://life-simulation-engine:8002")
AI_ORCHESTRATOR_URL = os.getenv("AI_ORCHESTRATOR_URL", "http://ai-orchestrator:8001")
TICK_INTERVAL_SECONDS = int(os.getenv("TICK_INTERVAL_SECONDS", "60"))

# ============================================================================
# Scheduler
# ============================================================================

scheduler = AsyncIOScheduler()

# ============================================================================
# Background Tasks
# ============================================================================

async def execute_simulation_tick():
    """Execute one simulation tick"""
    logger.info(">>> Executing simulation tick...")
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{LIFE_ENGINE_URL}/life/tick")
            response.raise_for_status()
            result = response.json()
            logger.info(f"Tick result: {result}")
    except Exception as e:
        logger.error(f"Error executing tick: {str(e)}")

async def generate_daily_summary():
    """Generate daily summary at end of simulation day"""
    logger.info(">>> Generating daily summary...")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get city state
            city_response = await client.get(f"{CORE_API_URL}/api/v1/city/state")
            city = city_response.json()
            
            # Get today's events
            events_response = await client.get(f"{CORE_API_URL}/api/v1/life/events?limit=100")
            events = events_response.json().get("events", [])
            
            # Get NPCs
            npcs_response = await client.get(f"{CORE_API_URL}/api/v1/npcs")
            npcs = npcs_response.json().get("npcs", [])
            
            # Generate summary via AI
            summary_response = await client.post(
                f"{AI_ORCHESTRATOR_URL}/ai/day-summary",
                json={"events": events, "npcs": npcs}
            )
            summary_data = summary_response.json()
            
            logger.info(f"Daily summary generated: {summary_data}")
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")

async def generate_daily_gossips():
    """Generate gossips for the day"""
    logger.info(">>> Generating daily gossips...")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get recent events
            events_response = await client.get(f"{CORE_API_URL}/api/v1/life/events?limit=50")
            events = events_response.json().get("events", [])
            
            # Generate 3-5 gossips
            for _ in range(3):
                gossip_response = await client.post(
                    f"{AI_ORCHESTRATOR_URL}/ai/gossip/generate",
                    json={"events": events}
                )
                gossip_data = gossip_response.json()
                logger.info(f"Gossip generated: {gossip_data}")
    except Exception as e:
        logger.error(f"Error generating gossips: {str(e)}")

async def cleanup_old_logs():
    """Clean up old logs and data"""
    logger.info(">>> Cleaning up old logs...")
    # Implementation depends on logging system

# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="ALEXVERSE Scheduler",
    version="1.0.0",
    description="Background job scheduler for ALEXVERSE"
)

# ============================================================================
# Startup/Shutdown
# ============================================================================

@app.on_event("startup")
async def startup():
    """Initialize scheduler"""
    logger.info("ALEXVERSE Scheduler starting...")
    
    # Add jobs
    scheduler.add_job(
        execute_simulation_tick,
        "interval",
        seconds=TICK_INTERVAL_SECONDS,
        id="simulation_tick",
        name="Simulation Tick"
    )
    
    scheduler.add_job(
        generate_daily_summary,
        "cron",
        hour=0,  # At midnight
        minute=0,
        id="daily_summary",
        name="Daily Summary"
    )
    
    scheduler.add_job(
        generate_daily_gossips,
        "cron",
        hour="0-23",
        minute="0,30",  # Every 30 minutes
        id="hourly_gossips",
        name="Hourly Gossips"
    )
    
    scheduler.add_job(
        cleanup_old_logs,
        "cron",
        hour=3,  # At 3 AM
        minute=0,
        id="cleanup",
        name="Log Cleanup"
    )
    
    scheduler.start()
    logger.info("Scheduler started with all jobs")

@app.on_event("shutdown")
async def shutdown():
    """Stop scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "service": "scheduler"}

@app.get("/jobs")
async def get_jobs():
    """Get all scheduled jobs"""
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "trigger": str(job.trigger),
            "next_run": str(job.next_run_time)
        })
    return {"jobs": jobs, "count": len(jobs)}

@app.post("/jobs/{job_id}/trigger")
async def trigger_job(job_id: str):
    """Manually trigger a job"""
    try:
        job = scheduler.get_job(job_id)
        if not job:
            return {"error": f"Job {job_id} not found"}
        
        # Execute job immediately
        await job.func()
        return {"status": "Job triggered", "job_id": job_id}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    config = uvicorn.Config(app, host="0.0.0.0", port=8003, log_level="info")
    server = uvicorn.Server(config)
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    loop.run_until_complete(server.serve())
