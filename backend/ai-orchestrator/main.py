#!/usr/bin/env python3
"""
ALEXVERSE Social & Story AI Orchestrator
Generates narratives, dialogues, and gossips using language models
"""

import os
from typing import Dict, List, Any, Optional
import json
import logging
import random
from datetime import datetime

from fastapi import FastAPI, HTTPException
import uvicorn
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-demo")  # Use local LLM in production
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")

# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="ALEXVERSE AI Orchestrator",
    version="1.0.0",
    description="AI service for generating narratives, dialogues, and gossips"
)

# ============================================================================
# Mock AI Functions (Replace with real LLM calls in production)
# ============================================================================

class AIOrchestrator:
    """Mock AI orchestrator - replace calls with real LLM API"""
    
    @staticmethod
    def generate_npc_dialogue(npc_name: str, npc_personality: Dict, user_message: str) -> str:
        """Generate NPC dialogue response"""
        # Mock responses - in production, call GPT/Claude/Llama
        responses = [
            f"¡Hola! {user_message} Interesante punto de vista que tienes ahí.",
            f"{npc_name}: Hmm, nunca lo había pensado así. {user_message}",
            f"Me parece que tienes razón en eso. En cualquier caso, {user_message}",
            f"¿De verdad crees eso? Pues mira, yo pienso que {user_message}",
        ]
        return random.choice(responses)

    @staticmethod
    def generate_gossip(events: List[Dict]) -> str:
        """Generate gossip from recent events"""
        if not events:
            return "La ciudad está tranquila últimamente."
        
        event = random.choice(events)
        gossips = [
            f"He oído que {event.get('description', 'algo pasó')} en {event.get('neighborhood_id', 'la ciudad')}",
            f"¿Ya escuchaste? Dicen que {event.get('description', 'hubo un evento')}, ¡increíble!",
            f"Me murmuraron que {event.get('description', 'algo ocurrió')}. Espero que sea cierto.",
        ]
        return random.choice(gossips)

    @staticmethod
    def generate_day_summary(events: List[Dict], npcs: List[Dict]) -> str:
        """Generate day summary narrative"""
        if not events:
            return "Fue un día tranquilo en la ciudad. Los NPCs seguían sus rutinas normales."
        
        summaries = [
            f"Un día agitado en ALEXVERSE. Se registraron {len(events)} eventos notables.",
            f"La ciudad experimentó varios cambios: {len(events)} eventos sucedieron.",
            f"Un día típico en la ciudad, aunque con {len(events)} eventos dignos de mención.",
        ]
        return random.choice(summaries)

    @staticmethod
    def generate_event_description(event_type: str, npcs_involved: List[str]) -> str:
        """Generate event description"""
        descriptions = {
            "discusion": f"{npcs_involved[0]} y {npcs_involved[1] if len(npcs_involved) > 1 else 'alguien'} tuvieron una acalorada discusión.",
            "fiesta": f"¡Una fiesta estalló en la ciudad! Todos querían unirse a la diversión.",
            "ruptura": f"{npcs_involved[0]} y {npcs_involved[1] if len(npcs_involved) > 1 else 'su pareja'} decidieron terminar su relación.",
            "nuevo_trabajo": f"{npcs_involved[0]} consiguió un nuevo trabajo. ¡Qué emocionante!",
            "boda": f"¡{npcs_involved[0]} se casó! A todos les encanta una boda.",
            "crimen": f"Un crimen fue reportado en la ciudad. ¡Qué escándalo!",
        }
        return descriptions.get(event_type, f"Algo pasó: {event_type}")

orchestrator = AIOrchestrator()

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "service": "ai-orchestrator"}

@app.post("/ai/npc/dialogue")
async def generate_dialogue(
    npc_id: str,
    npc_name: str,
    user_message: str,
    npc_personality: Dict = None
):
    """Generate NPC dialogue"""
    if not npc_personality:
        npc_personality = {"introvertido": 50, "impulsivo": 50}
    
    try:
        response = orchestrator.generate_npc_dialogue(npc_name, npc_personality, user_message)
        
        # Store dialogue in database
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{CORE_API_URL}/ai/dialogue/log",
                    json={
                        "npc_id": npc_id,
                        "user_message": user_message,
                        "npc_response": response
                    }
                )
            except:
                pass  # Failure to log shouldn't break response
        
        return {
            "npc_id": npc_id,
            "npc_response": response,
            "emotion": random.choice(["happy", "neutral", "thoughtful"]),
            "relationship_change": random.randint(-5, 5)
        }
    except Exception as e:
        logger.error(f"Error generating dialogue: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating dialogue")

@app.post("/ai/gossip/generate")
async def generate_gossip(events: List[Dict]):
    """Generate gossip from events"""
    try:
        gossip_text = orchestrator.generate_gossip(events)
        return {
            "gossip": gossip_text,
            "intensity": random.randint(20, 90),
            "spread_potential": random.randint(30, 100)
        }
    except Exception as e:
        logger.error(f"Error generating gossip: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating gossip")

@app.post("/ai/day-summary")
async def generate_day_summary(
    events: List[Dict],
    npcs: List[Dict]
):
    """Generate daily summary"""
    try:
        summary_text = orchestrator.generate_day_summary(events, npcs)
        return {
            "summary": summary_text,
            "mood_trajectory": random.choice(["positive", "neutral", "negative"]),
            "highlights": [e.get("event_type", "event") for e in events[:3]]
        }
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating summary")

@app.post("/ai/event/description")
async def generate_event_description(
    event_type: str,
    npcs_involved: List[str] = None
):
    """Generate event description"""
    if not npcs_involved:
        npcs_involved = ["Someone", "Someone else"]
    
    try:
        description = orchestrator.generate_event_description(event_type, npcs_involved)
        return {
            "event_type": event_type,
            "description": description,
            "narrative_tone": random.choice(["dramatic", "humorous", "tragic", "romantic"])
        }
    except Exception as e:
        logger.error(f"Error generating description: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating description")

@app.post("/ai/npc/personality/generate")
async def generate_npc_personality(
    name: str,
    age: int,
    occupation: str
):
    """Generate NPC personality profile"""
    try:
        personality = {
            "introvertido": random.randint(20, 80),
            "impulsivo": random.randint(20, 80),
            "romantico": random.randint(20, 80),
            "ambicioso": random.randint(20, 80),
            "creativo": random.randint(20, 80),
            "empático": random.randint(20, 80),
            "tímido": random.randint(20, 80),
        }
        return {
            "name": name,
            "personality": personality,
            "archetype": random.choice(["artist", "professional", "adventurer", "caregiver"])
        }
    except Exception as e:
        logger.error(f"Error generating personality: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating personality")

@app.post("/ai/city/mood/analyze")
async def analyze_city_mood(
    recent_events: List[Dict],
    drama_level: int,
    conflict_level: int
):
    """Analyze overall city mood"""
    try:
        mood_score = 50
        
        # Adjust based on events
        for event in recent_events:
            if event.get("event_type") in ["ruptura", "crimen", "discusion"]:
                mood_score -= event.get("severity", 50) / 10
            elif event.get("event_type") in ["fiesta", "boda"]:
                mood_score += event.get("severity", 50) / 10
        
        # Adjust based on city parameters
        mood_score -= drama_level / 5
        mood_score -= conflict_level / 5
        
        mood_score = max(0, min(100, mood_score))
        
        return {
            "current_mood_score": int(mood_score),
            "mood_state": "happy" if mood_score > 60 else "neutral" if mood_score > 30 else "sad",
            "recommendation": "La ciudad podría beneficiarse de una fiesta" if mood_score < 40 else "La ciudad está en buen estado emocional"
        }
    except Exception as e:
        logger.error(f"Error analyzing mood: {str(e)}")
        raise HTTPException(status_code=500, detail="Error analyzing mood")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
