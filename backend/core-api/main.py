#!/usr/bin/env python3
"""
ALEXVERSE Core API Gateway
Central API for all client interactions (web, Discord, internal services)
"""

import os
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from functools import lru_cache

import jwt
from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import psycopg2
from psycopg2.extras import RealDictCursor
import psycopg2.pool
import httpx
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "alexverse")
DB_USER = os.getenv("DB_USER", "alexverse")
DB_PASSWORD = os.getenv("DB_PASSWORD", "alexverse")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")
JWT_ALGORITHM = "HS256"
AI_ORCHESTRATOR_URL = os.getenv("AI_ORCHESTRATOR_URL", "http://ai-orchestrator:8001")

# ============================================================================
# Database Pool
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
        logger.info("Core API - Database pool initialized")

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
# JWT & Security
# ============================================================================

security = HTTPBearer()

def create_jwt_token(user_id: str, role: str = "observer") -> str:
    """Create JWT token"""
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=30),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(credentials: HTTPAuthCredentials) -> Dict[str, Any]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_admin(payload: Dict = Depends(verify_jwt_token)) -> Dict:
    """Verify admin role"""
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="ALEXVERSE Core API",
    version="1.0.0",
    description="Central API gateway for ALEXVERSE Life simulation"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Startup/Shutdown
# ============================================================================

@app.on_event("startup")
async def startup():
    db_pool.init()
    logger.info("Core API started")

@app.on_event("shutdown")
async def shutdown():
    db_pool.close_all()

# ============================================================================
# Helper Functions
# ============================================================================

def get_default_city():
    """Get default city ID"""
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id FROM city_states LIMIT 1")
        city = cur.fetchone()
        cur.close()
        return city['id'] if city else None
    finally:
        db_pool.return_connection(conn)

# ============================================================================
# HEALTH & AUTH
# ============================================================================

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "service": "core-api"}

@app.post("/auth/login")
async def login(user_id: str, password: str):
    """Simple auth endpoint (in production, use proper OAuth/LDAP)"""
    # Mock authentication
    if password == "admin":
        token = create_jwt_token(user_id, role="admin")
        return {"token": token, "role": "admin"}
    else:
        token = create_jwt_token(user_id, role="observer")
        return {"token": token, "role": "observer"}

# ============================================================================
# CITY ENDPOINTS
# ============================================================================

@app.get("/api/v1/city/state")
async def get_city_state(city_id: Optional[str] = None):
    """Get city state"""
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, name, current_time, current_day, mood_index, 
                   drama_level, romance_level, conflict_level
            FROM city_states WHERE id = %s
        """, (city_id,))
        city = cur.fetchone()
        cur.close()
        return dict(city) if city else {"error": "City not found"}
    finally:
        db_pool.return_connection(conn)

@app.get("/api/v1/city/neighborhoods")
async def get_neighborhoods(city_id: Optional[str] = None):
    """Get all neighborhoods in a city"""
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, name, type, wealth_level, safety_level, happiness_level, population_count
            FROM neighborhoods WHERE city_id = %s
            ORDER BY name
        """, (city_id,))
        neighborhoods = [dict(n) for n in cur.fetchall()]
        cur.close()
        return {"neighborhoods": neighborhoods}
    finally:
        db_pool.return_connection(conn)

@app.get("/api/v1/city/weather")
async def get_weather(city_id: Optional[str] = None):
    """Get current weather"""
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT cs.weather_state_id, ws.type, ws.temperature, ws.humidity, ws.intensity
            FROM city_states cs
            LEFT JOIN weather_states ws ON cs.weather_state_id = ws.id
            WHERE cs.id = %s
        """, (city_id,))
        result = cur.fetchone()
        cur.close()
        return dict(result) if result else {"error": "Weather not found"}
    finally:
        db_pool.return_connection(conn)

# ============================================================================
# NPC ENDPOINTS
# ============================================================================

@app.get("/api/v1/npcs")
async def get_npcs(city_id: Optional[str] = None, limit: int = 100):
    """Get all NPCs"""
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, name, age, gender, occupation, mood_state, energy_level, 
                   social_need, current_place_id, home_neighborhood_id
            FROM npcs WHERE city_id = %s
            LIMIT %s
        """, (city_id, limit))
        npcs = [dict(n) for n in cur.fetchall()]
        cur.close()
        return {"npcs": npcs, "count": len(npcs)}
    finally:
        db_pool.return_connection(conn)

@app.get("/api/v1/npc/{npc_id}")
async def get_npc(npc_id: str):
    """Get specific NPC details"""
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT * FROM v_npc_status WHERE id = %s
        """, (npc_id,))
        npc = cur.fetchone()
        if not npc:
            raise HTTPException(status_code=404, detail="NPC not found")
        cur.close()
        return dict(npc)
    finally:
        db_pool.return_connection(conn)

@app.get("/api/v1/npc/{npc_id}/relationships")
async def get_npc_relationships(npc_id: str):
    """Get NPC relationships"""
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT nr.id, nr.other_npc_id, n.name as other_npc_name, 
                   nr.relationship_type, nr.affinity, nr.interaction_count
            FROM npc_relationships nr
            JOIN npcs n ON nr.other_npc_id = n.id
            WHERE nr.npc_id = %s
            ORDER BY nr.affinity DESC
        """, (npc_id,))
        relationships = [dict(r) for r in cur.fetchall()]
        cur.close()
        return {"relationships": relationships}
    finally:
        db_pool.return_connection(conn)

@app.post("/api/v1/npc/{npc_id}/message")
async def send_npc_message(npc_id: str, message: str):
    """Send message to NPC (triggers AI response)"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AI_ORCHESTRATOR_URL}/ai/npc/dialogue",
                json={
                    "npc_id": npc_id,
                    "user_message": message
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ============================================================================
# EVENTS & NARRATIVE ENDPOINTS
# ============================================================================

@app.get("/api/v1/life/events")
async def get_life_events(city_id: Optional[str] = None, limit: int = 50):
    """Get recent life events"""
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT * FROM v_recent_events 
            WHERE id IN (SELECT id FROM life_events WHERE city_id = %s)
            LIMIT %s
        """, (city_id, limit))
        events = [dict(e) for e in cur.fetchall()]
        cur.close()
        return {"events": events, "count": len(events)}
    finally:
        db_pool.return_connection(conn)

@app.get("/api/v1/gossips")
async def get_gossips(city_id: Optional[str] = None, limit: int = 20):
    """Get recent gossips"""
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, text, intensity, created_at, spread_count
            FROM gossips WHERE city_id = %s AND visibility != 'admin_only'
            ORDER BY created_at DESC
            LIMIT %s
        """, (city_id, limit))
        gossips = [dict(g) for g in cur.fetchall()]
        cur.close()
        return {"gossips": gossips, "count": len(gossips)}
    finally:
        db_pool.return_connection(conn)

@app.get("/api/v1/day-summaries")
async def get_day_summaries(city_id: Optional[str] = None, limit: int = 10):
    """Get day summaries"""
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, city_day, summary_text, mood_trajectory, created_at
            FROM day_summaries WHERE city_id = %s
            ORDER BY city_day DESC
            LIMIT %s
        """, (city_id, limit))
        summaries = [dict(s) for s in cur.fetchall()]
        cur.close()
        return {"summaries": summaries}
    finally:
        db_pool.return_connection(conn)

# ============================================================================
# GOD MODE ENDPOINTS (Admin only)
# ============================================================================

@app.post("/api/v1/god/weather/set")
async def god_set_weather(
    weather_type: str,
    temperature: int,
    city_id: Optional[str] = None,
    credentials: HTTPAuthCredentials = Depends(security)
):
    """God mode: Set weather"""
    payload = verify_jwt_token(credentials)
    verify_admin(payload)
    
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO weather_states (city_id, type, temperature, humidity, intensity)
            VALUES (%s, %s, %s, 60, 50)
        """, (city_id, weather_type, temperature))
        
        cur.execute("""
            UPDATE city_states SET weather_state_id = LASTVAL() WHERE id = %s
        """, (city_id,))
        
        conn.commit()
        cur.close()
        return {"status": "Weather updated", "type": weather_type, "temperature": temperature}
    finally:
        db_pool.return_connection(conn)

@app.post("/api/v1/god/drama/set")
async def god_set_drama(
    drama_level: int,
    city_id: Optional[str] = None,
    credentials: HTTPAuthCredentials = Depends(security)
):
    """God mode: Set drama level"""
    payload = verify_jwt_token(credentials)
    verify_admin(payload)
    
    if not city_id:
        city_id = get_default_city()
    
    drama_level = max(0, min(100, drama_level))
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE city_states SET drama_level = %s, updated_at = NOW() WHERE id = %s
        """, (drama_level, city_id))
        conn.commit()
        cur.close()
        return {"status": "Drama level set", "drama_level": drama_level}
    finally:
        db_pool.return_connection(conn)

@app.post("/api/v1/god/npc/create")
async def god_create_npc(
    name: str,
    age: int,
    gender: str,
    occupation: str,
    city_id: Optional[str] = None,
    credentials: HTTPAuthCredentials = Depends(security)
):
    """God mode: Create NPC"""
    payload = verify_jwt_token(credentials)
    verify_admin(payload)
    
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO npcs (city_id, name, age, gender, occupation, personality_profile)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (city_id, name, age, gender, occupation, json.dumps({
            "introvertido": 50,
            "impulsivo": 50,
            "romantico": 50
        })))
        npc_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return {"status": "NPC created", "npc_id": npc_id, "name": name}
    finally:
        db_pool.return_connection(conn)

@app.post("/api/v1/god/city/party")
async def god_trigger_party(
    neighborhood_id: str,
    city_id: Optional[str] = None,
    credentials: HTTPAuthCredentials = Depends(security)
):
    """God mode: Trigger global party"""
    payload = verify_jwt_token(credentials)
    verify_admin(payload)
    
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO life_events 
            (city_id, event_type, city_day, city_time, neighborhood_id, severity, 
             description, raw_data)
            VALUES (%s, %s, 0, 0, %s, %s, %s, %s)
        """, (city_id, "fiesta_masiva", neighborhood_id, 80, 
              "¡Una fiesta masiva estalló en la ciudad!", json.dumps({"scale": "massive"})))
@app.post("/api/v1/god/city/blackout")
async def god_trigger_blackout(
    neighborhood_id: Optional[str] = None,
    city_id: Optional[str] = None,
    credentials: HTTPAuthCredentials = Depends(security)
):
    """God mode: Trigger blackout"""
    payload = verify_jwt_token(credentials)
    verify_admin(payload)
    
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO life_events 
            (city_id, event_type, city_day, city_time, neighborhood_id, severity, 
             description, raw_data)
            VALUES (%s, %s, 0, 0, %s, %s, %s, %s)
        """, (city_id, "apagon", neighborhood_id, 70, 
              "¡Un apagón masivo dejó a la ciudad a oscuras!", json.dumps({"duration": "2_hours"})))
        conn.commit()
        cur.close()
        return {"status": "Blackout triggered", "neighborhood_id": neighborhood_id}
    finally:
        db_pool.return_connection(conn)

@app.post("/api/v1/god/npc/move")
async def god_move_npc(
    npc_id: str,
    place_id: str,
    credentials: HTTPAuthCredentials = Depends(security)
):
    """God mode: Move NPC to place"""
    payload = verify_jwt_token(credentials)
    verify_admin(payload)
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE npcs SET current_place_id = %s, updated_at = NOW() WHERE id = %s
        """, (place_id, npc_id))
        conn.commit()
        cur.close()
        return {"status": "NPC moved", "npc_id": npc_id, "place_id": place_id}
    finally:
        db_pool.return_connection(conn)

@app.post("/api/v1/god/npc/relationship")
async def god_modify_relationship(
    npc_id: str,
    other_npc_id: str,
    affinity_change: int,
    credentials: HTTPAuthCredentials = Depends(security)
):
    """God mode: Modify NPC relationship"""
    payload = verify_jwt_token(credentials)
    verify_admin(payload)
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO npc_relationships (npc_id, other_npc_id, relationship_type, affinity)
            VALUES (%s, %s, 'conocido', %s)
            ON CONFLICT (npc_id, other_npc_id) 
            DO UPDATE SET affinity = npc_relationships.affinity + %s
        """, (npc_id, other_npc_id, affinity_change, affinity_change))
        conn.commit()
        cur.close()
        return {"status": "Relationship modified", "npc_id": npc_id, "other_npc_id": other_npc_id, "affinity_change": affinity_change}
    finally:
        db_pool.return_connection(conn)

# ============================================================================
# INTERNAL ENDPOINTS (for other services)
# ============================================================================

@app.post("/internal/life/tick")
async def internal_life_tick(city_id: Optional[str] = None):
    """Internal endpoint for life simulation tick"""
    if not city_id:
        city_id = get_default_city()
    
    # This would trigger the life simulation engine
    # For now, just update the time
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE city_states SET current_time = current_time + 1, updated_at = NOW() WHERE id = %s
        """, (city_id,))
        conn.commit()
        cur.close()
        return {"status": "Tick processed", "city_id": city_id}
    finally:
        db_pool.return_connection(conn)

@app.post("/internal/ai/gossip/generate")
async def internal_generate_gossip(city_id: Optional[str] = None):
    """Internal endpoint to generate gossip"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AI_ORCHESTRATOR_URL}/ai/gossip/generate",
                json={"city_id": city_id or get_default_city()},
                timeout=30.0
            )
            response.raise_for_status()
            gossip_data = response.json()
            
            # Save to DB
            conn = db_pool.get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO gossips (city_id, text, intensity, visibility)
                    VALUES (%s, %s, %s, %s)
                """, (city_id or get_default_city(), gossip_data['text'], gossip_data['intensity'], 'public'))
                conn.commit()
                cur.close()
            finally:
                db_pool.return_connection(conn)
            
            return gossip_data
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.post("/internal/ai/day-summary")
async def internal_generate_day_summary(city_id: Optional[str] = None):
    """Internal endpoint to generate day summary"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AI_ORCHESTRATOR_URL}/ai/day-summary",
                json={"city_id": city_id or get_default_city()},
                timeout=30.0
            )
            response.raise_for_status()
            summary_data = response.json()
            
            # Save to DB
            conn = db_pool.get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO day_summaries (city_id, city_day, summary_text, mood_trajectory)
                    VALUES (%s, 0, %s, %s)
                """, (city_id or get_default_city(), summary_data['summary'], summary_data['mood_trajectory']))
                conn.commit()
                cur.close()
            finally:
                db_pool.return_connection(conn)
            
            return summary_data
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.get("/api/v1/logs/npc-thoughts")
async def get_npc_thoughts(city_id: Optional[str] = None, limit: int = 20):
    """Get recent NPC thoughts/logs for God Mode monitoring"""
    if not city_id:
        city_id = get_default_city()
    
    conn = db_pool.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT 
                n.name as npc_name,
                nm.content as thought,
                nm.importance,
                nm.created_at,
                nm.memory_type
            FROM npc_memories nm
            JOIN npcs n ON nm.npc_id = n.id
            WHERE n.city_id = %s
            ORDER BY nm.created_at DESC
            LIMIT %s
        """, (city_id, limit))
        thoughts = [dict(t) for t in cur.fetchall()]
        cur.close()
        return {"thoughts": thoughts}
    finally:
        db_pool.return_connection(conn)
