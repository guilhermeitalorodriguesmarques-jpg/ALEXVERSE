#!/usr/bin/env python3
"""
ALEXVERSE Life Simulation Engine
Core simulation logic for NPCs, events, and city state
"""

import asyncio
import random
import logging
from datetime import datetime
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict, field
import json
import os

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
import psycopg2.pool

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "alexverse")
DB_USER = os.getenv("DB_USER", "alexverse")
DB_PASSWORD = os.getenv("DB_PASSWORD", "alexverse")
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")
AI_ORCHESTRATOR_URL = os.getenv("AI_ORCHESTRATOR_URL", "http://ai-orchestrator:8001")

# ============================================================================
# Database Connection Pool
# ============================================================================

class DatabasePool:
    def __init__(self):
        self.pool = None

    def init(self):
        self.pool = psycopg2.pool.SimpleConnectionPool(
            1, 20,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        logger.info("Database pool initialized")

    def get_connection(self):
        if not self.pool:
            self.init()
        return self.pool.getconn()

    def return_connection(self, conn):
        if self.pool:
            self.pool.putconn(conn)

    def close_all(self):
        if self.pool:
            self.pool.closeall()

db_pool = DatabasePool()

# ============================================================================
# Data Models
# ============================================================================

@dataclass
class NPCMoodUpdate:
    npc_id: str
    energy_level: int
    social_need: int
    hunger_level: int
    mood_state: str

@dataclass
class LifeEvent:
    event_type: str
    city_day: int
    city_time: int
    neighborhood_id: Optional[str] = None
    place_id: Optional[str] = None
    npc_main_id: Optional[str] = None
    npc_other_id: Optional[str] = None
    severity: int = 50
    description: str = ""
    raw_data: Dict[str, Any] = field(default_factory=dict)

# ============================================================================
# Simulation Engine Core
# ============================================================================

class LifeSimulationEngine:
    def __init__(self, city_id: str):
        self.city_id = city_id
        self.http_client = httpx.AsyncClient(timeout=30.0)

    async def fetch_city_state(self) -> Dict[str, Any]:
        """Fetch current city state from database"""
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT id, name, current_time, current_day, mood_index, 
                       drama_level, romance_level, conflict_level, weather_state_id
                FROM city_states WHERE id = %s
            """, (self.city_id,))
            city = cur.fetchone()
            cur.close()
            return dict(city) if city else None
        finally:
            db_pool.return_connection(conn)

    async def fetch_all_npcs(self) -> List[Dict[str, Any]]:
        """Fetch all NPCs for the city"""
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT id, name, age, gender, occupation, personality_profile,
                       mood_state, energy_level, social_need, hunger_level,
                       current_place_id, home_neighborhood_id
                FROM npcs WHERE city_id = %s
            """, (self.city_id,))
            npcs = cur.fetchall()
            cur.close()
            return [dict(npc) for npc in npcs]
        finally:
            db_pool.return_connection(conn)

    async def fetch_npc_routines(self, npc_id: str, current_hour: int) -> Optional[Dict[str, Any]]:
        """Fetch routine for NPC at current hour"""
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT id, expected_place_type, expected_place_id, activity_description, flexibility
                FROM npc_routines
                WHERE npc_id = %s AND hour = %s
                ORDER BY priority DESC LIMIT 1
            """, (npc_id, current_hour))
            routine = cur.fetchone()
            cur.close()
            return dict(routine) if routine else None
        finally:
            db_pool.return_connection(conn)

    async def fetch_npc_relationships(self, npc_id: str) -> List[Dict[str, Any]]:
        """Fetch relationships for an NPC"""
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT id, other_npc_id, relationship_type, affinity
                FROM npc_relationships WHERE npc_id = %s
            """, (npc_id,))
            rels = cur.fetchall()
            cur.close()
            return [dict(rel) for rel in rels]
        finally:
            db_pool.return_connection(conn)

    async def update_npc_mood(self, npc_id: str, mood_changes: Dict[str, int]):
        """Update NPC mood and stats"""
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor()
            updates = []
            if "energy_level" in mood_changes:
                updates.append(f"energy_level = {mood_changes['energy_level']}")
            if "hunger_level" in mood_changes:
                updates.append(f"hunger_level = {mood_changes['hunger_level']}")
            if "mood_state" in mood_changes:
                updates.append(f"mood_state = '{mood_changes['mood_state']}'")
            
            if updates:
                query = f"UPDATE npcs SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s"
                cur.execute(query, (npc_id,))
                conn.commit()
            cur.close()
        finally:
            db_pool.return_connection(conn)

    async def create_life_event(self, event: LifeEvent) -> str:
        """Create a new life event"""
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO life_events 
                (city_id, event_type, city_day, city_time, neighborhood_id, place_id,
                 npc_main_id, npc_other_id, severity, description, raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                self.city_id, event.event_type, event.city_day, event.city_time,
                event.neighborhood_id, event.place_id, event.npc_main_id, event.npc_other_id,
                event.severity, event.description, json.dumps(event.raw_data)
            ))
            event_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return event_id
        finally:
            db_pool.return_connection(conn)

    async def update_npc_location(self, npc_id: str, place_id: Optional[str]):
        """Update NPC current location"""
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                UPDATE npcs SET current_place_id = %s, updated_at = NOW() WHERE id = %s
            """, (place_id, npc_id))
            conn.commit()
            cur.close()
        finally:
            db_pool.return_connection(conn)

    async def process_npc_routines(self, npcs: List[Dict], current_hour: int):
        """Process NPC routines for current hour"""
        logger.info(f"Processing routines for {len(npcs)} NPCs at hour {current_hour}")
        for npc in npcs:
            routine = await self.fetch_npc_routines(npc['id'], current_hour)
            if routine:
                # Move NPC to expected place
                await self.update_npc_location(npc['id'], routine.get('expected_place_id'))
                # Adjust energy based on activity
                energy_change = -15 if "trabajo" in routine.get('activity_description', '') else -10
                await self.update_npc_mood(npc['id'], {
                    'energy_level': max(0, npc['energy_level'] + energy_change)
                })

    async def generate_social_interactions(self, npcs: List[Dict]):
        """Generate potential social interactions between NPCs"""
        logger.info("Generating social interactions")
        random.shuffle(npcs)
        
        for i in range(0, len(npcs) - 1, 2):
            npc1, npc2 = npcs[i], npcs[i + 1]
            
            # Check if NPCs are in same place
            if npc1['current_place_id'] != npc2['current_place_id']:
                continue

            # Probability of interaction based on traits
            interaction_chance = random.randint(20, 80)
            if interaction_chance < 40:
                continue

            relationships = await self.fetch_npc_relationships(npc1['id'])
            existing_rel = next((r for r in relationships if r['other_npc_id'] == npc2['id']), None)
            
            if existing_rel and existing_rel['affinity'] < -30:
                # Potential conflict
                if random.random() < 0.3:
                    await self._generate_conflict_event(npc1, npc2)

    async def _generate_conflict_event(self, npc1: Dict, npc2: Dict):
        """Generate a conflict between two NPCs"""
        event = LifeEvent(
            event_type="discusion",
            city_day=0,
            city_time=0,
            npc_main_id=npc1['id'],
            npc_other_id=npc2['id'],
            severity=random.randint(20, 60),
            description=f"{npc1['name']} y {npc2['name']} tuvieron una discusión acalorada",
            raw_data={
                "reason": random.choice(["romance", "dinero", "respeto", "rivalidad"]),
                "intensity": random.randint(1, 10)
            }
        )
        event_id = await self.create_life_event(event)
        logger.info(f"Conflict event created: {event_id}")

    async def update_city_mood(self):
        """Update overall city mood based on recent events"""
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Get recent negative events
            cur.execute("""
                SELECT COUNT(*) as count, AVG(severity) as avg_severity
                FROM life_events 
                WHERE city_id = %s AND event_type IN ('discusion', 'ruptura', 'crimen')
                AND created_at > NOW() - INTERVAL '1 hour'
            """, (self.city_id,))
            result = cur.fetchone()
            
            mood_change = 0
            if result['avg_severity']:
                mood_change = int(-result['avg_severity'] / 10)
            
            # Update city mood
            cur.execute("""
                UPDATE city_states 
                SET mood_index = GREATEST(0, LEAST(100, mood_index + %s)),
                    updated_at = NOW()
                WHERE id = %s
            """, (mood_change, self.city_id))
            conn.commit()
            cur.close()
        finally:
            db_pool.return_connection(conn)

    async def tick(self) -> Dict[str, Any]:
        """Execute one simulation tick"""
        logger.info("=== BEGINNING SIMULATION TICK ===")
        start_time = datetime.now()
        
        try:
            # Fetch city state
            city = await self.fetch_city_state()
            if not city:
                raise ValueError(f"City {self.city_id} not found")

            current_hour = city['current_time']
            current_day = city['current_day']

            # Fetch all NPCs
            npcs = await self.fetch_all_npcs()
            logger.info(f"Processing simulation tick for {len(npcs)} NPCs")

            # Process routines
            await self.process_npc_routines(npcs, current_hour)

            # Generate social interactions
            await self.generate_social_interactions(npcs)

            # Update city mood
            await self.update_city_mood()

            # Advance time
            new_hour = (current_hour + 1) % 24
            new_day = current_day + (1 if new_hour == 0 else 0)

            conn = db_pool.get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    UPDATE city_states 
                    SET current_time = %s, current_day = %s, updated_at = NOW()
                    WHERE id = %s
                """, (new_hour, new_day, self.city_id))
                conn.commit()
                cur.close()
            finally:
                db_pool.return_connection(conn)

            execution_time = (datetime.now() - start_time).total_seconds() * 1000

            result = {
                "success": True,
                "tick_number": current_day * 24 + current_hour,
                "new_hour": new_hour,
                "new_day": new_day,
                "npcs_processed": len(npcs),
                "execution_time_ms": int(execution_time),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Tick completed in {execution_time:.2f}ms")
            return result

        except Exception as e:
            logger.error(f"Error during tick: {str(e)}", exc_info=True)
            raise

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="ALEXVERSE Life Simulation Engine",
    version="1.0.0",
    description="Core simulation engine for NPCs and city events"
)

# Startup/Shutdown
@app.on_event("startup")
async def startup():
    db_pool.init()
    logger.info("Life Simulation Engine started")

@app.on_event("shutdown")
async def shutdown():
    db_pool.close_all()
    logger.info("Life Simulation Engine shutdown")

# ============================================================================
# API Endpoints
# ============================================================================

@app.post("/life/tick")
async def trigger_tick(city_id: str = ""):
    """Execute one simulation tick"""
    if not city_id:
        # Try to get default city
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id FROM city_states LIMIT 1")
            city = cur.fetchone()
            cur.close()
            if city:
                city_id = city['id']
            else:
                raise HTTPException(status_code=404, detail="No city found")
        finally:
            db_pool.return_connection(conn)

    engine = LifeSimulationEngine(city_id)
    result = await engine.tick()
    return result

@app.get("/life/city/state")
async def get_city_state(city_id: str = ""):
    """Get current city state"""
    if not city_id:
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id FROM city_states LIMIT 1")
            city = cur.fetchone()
            cur.close()
            if city:
                city_id = city['id']
        finally:
            db_pool.return_connection(conn)

    engine = LifeSimulationEngine(city_id)
    city = await engine.fetch_city_state()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@app.get("/life/npcs")
async def get_npcs(city_id: str = ""):
    """Get all NPCs"""
    if not city_id:
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id FROM city_states LIMIT 1")
            city = cur.fetchone()
            cur.close()
            if city:
                city_id = city['id']
        finally:
            db_pool.return_connection(conn)

    engine = LifeSimulationEngine(city_id)
    npcs = await engine.fetch_all_npcs()
    return {"npcs": npcs, "count": len(npcs)}

@app.get("/life/events")
async def get_recent_events(city_id: str = "", limit: int = 50):
    """Get recent events"""
    if not city_id:
        conn = db_pool.get_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id FROM city_states LIMIT 1")
            city = cur.fetchone()
            cur.close()
            if city:
                city_id = city['id']
        finally:
            db_pool.return_connection(conn)

    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT * FROM v_recent_events WHERE id IN (
                SELECT id FROM life_events WHERE city_id = %s
            ) LIMIT %s
        """, (city_id, limit))
        events = [dict(e) for e in cur.fetchall()]
        cur.close()
        return {"events": events, "count": len(events)}
    finally:
        db_pool.return_connection(conn)

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "life-simulation-engine"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
