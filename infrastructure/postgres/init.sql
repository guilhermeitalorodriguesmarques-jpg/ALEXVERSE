-- ALEXVERSE Life - PostgreSQL Schema
-- Comprehensive database schema for life simulation

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS jsonb;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. CITY & ENVIRONMENT
-- ============================================================================

-- City state
CREATE TABLE city_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    current_time INT NOT NULL DEFAULT 0, -- In-game hour (0-23)
    current_day INT NOT NULL DEFAULT 0,
    weather_state_id UUID,
    mood_index INT DEFAULT 50 CHECK (mood_index >= 0 AND mood_index <= 100),
    drama_level INT DEFAULT 30 CHECK (drama_level >= 0 AND drama_level <= 100),
    romance_level INT DEFAULT 30 CHECK (romance_level >= 0 AND romance_level <= 100),
    conflict_level INT DEFAULT 20 CHECK (conflict_level >= 0 AND conflict_level <= 100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Weather states
CREATE TABLE weather_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES city_states(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- soleado, lluvia, tormenta, nublado, ola_calor, nevada
    temperature INT NOT NULL, -- -50 to 50 Celsius
    humidity INT NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
    intensity INT NOT NULL CHECK (intensity >= 0 AND intensity <= 100),
    wind_speed INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Neighborhoods
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES city_states(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- residencial, comercial, entretenimiento, industrial
    wealth_level INT NOT NULL CHECK (wealth_level >= 0 AND wealth_level <= 100),
    safety_level INT NOT NULL CHECK (safety_level >= 0 AND safety_level <= 100),
    happiness_level INT NOT NULL CHECK (happiness_level >= 0 AND happiness_level <= 100),
    population_count INT DEFAULT 0,
    average_rent INT DEFAULT 500,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, name)
);

-- Places in neighborhoods
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- casa, oficina, bar, restaurante, parque, tienda, club, hospital, escuela
    capacity INT DEFAULT 50,
    current_occupancy INT DEFAULT 0,
    atmosphere_level INT DEFAULT 50,
    music_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(neighborhood_id, name)
);

-- ============================================================================
-- 2. NPCs (CHARACTERS)
-- ============================================================================

-- NPCs table
CREATE TABLE npcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES city_states(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL CHECK (age >= 18 AND age <= 100),
    gender VARCHAR(50) NOT NULL, -- male, female, non-binary
    occupation VARCHAR(255) NOT NULL,
    income_daily DECIMAL(10, 2) DEFAULT 50.0,
    home_neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
    current_place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    current_location_x DECIMAL(10, 4),
    current_location_y DECIMAL(10, 4),
    personality_profile JSONB NOT NULL DEFAULT '{}', -- {introvertido: 0-100, impulsivo: 0-100, romantico: 0-100, etc}
    mood_state VARCHAR(50) NOT NULL DEFAULT 'neutral', -- feliz, triste, enfadado, ansioso, neutro, enamorado
    inventory JSONB DEFAULT '{}',
    appearance JSONB DEFAULT '{}', -- {hair_color, eye_color, skin_tone, style, etc}
    energy_level INT NOT NULL DEFAULT 80 CHECK (energy_level >= 0 AND energy_level <= 100),
    social_need INT NOT NULL DEFAULT 50 CHECK (social_need >= 0 AND social_need <= 100),
    hunger_level INT DEFAULT 50 CHECK (hunger_level >= 0 AND hunger_level <= 100),
    hygiene_level INT DEFAULT 80 CHECK (hygiene_level >= 0 AND hygiene_level <= 100),
    health_status VARCHAR(50) DEFAULT 'sano', -- sano, enfermo, herido, triste
    current_activity VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, name)
);

-- NPC Relationships
CREATE TABLE npc_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    other_npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- amigo, pareja, enemigo, conocido, familiar, admirador, rival
    affinity INT NOT NULL CHECK (affinity >= -100 AND affinity <= 100),
    interaction_count INT DEFAULT 0,
    last_interaction_at TIMESTAMP,
    shared_interests JSONB DEFAULT '[]',
    drama_history JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(npc_id, other_npc_id),
    CHECK (npc_id != other_npc_id)
);

-- NPC Routines
CREATE TABLE npc_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
    day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
    expected_place_type VARCHAR(50),
    expected_place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    priority INT DEFAULT 50,
    activity_description VARCHAR(255),
    flexibility INT DEFAULT 70, -- How likely to deviate from routine (0-100)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(npc_id, hour, day_of_week)
);

-- NPC Memories
CREATE TABLE npc_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES life_events(id) ON DELETE SET NULL,
    memory_type VARCHAR(50) NOT NULL, -- evento, interaccion, trauma, logro, romance, conflicto, diversión
    content TEXT NOT NULL,
    importance INT NOT NULL CHECK (importance >= 0 AND importance <= 100),
    emotion_tag VARCHAR(50),
    related_npcs UUID[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retrieved_at TIMESTAMP
);

-- ============================================================================
-- 3. LIFE EVENTS & NARRATIVES
-- ============================================================================

-- Life Events
CREATE TABLE life_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES city_states(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- discusion, fiesta, ruptura, nuevo_trabajo, mudanza, apagon, crimen, proposicion_matrimonio
    city_time INT NOT NULL, -- Hour when event occurred
    city_day INT NOT NULL,
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
    place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    npc_main_id UUID REFERENCES npcs(id) ON DELETE SET NULL,
    npc_other_id UUID REFERENCES npcs(id) ON DELETE SET NULL,
    severity INT NOT NULL CHECK (severity >= 0 AND severity <= 100),
    raw_data JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    visibility VARCHAR(50) DEFAULT 'public', -- public, private, admin_only
    impact_on_city JSONB DEFAULT '{}', -- {mood_change: -5, drama_increase: 10, etc}
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Gossip (Chismes)
CREATE TABLE gossips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES city_states(id) ON DELETE CASCADE,
    event_id UUID REFERENCES life_events(id) ON DELETE SET NULL,
    originating_npc_id UUID REFERENCES npcs(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    intensity INT DEFAULT 50 CHECK (intensity >= 0 AND intensity <= 100),
    visibility VARCHAR(50) NOT NULL DEFAULT 'public', -- public, admin_only, discord_only
    spread_count INT DEFAULT 0,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Day Summaries
CREATE TABLE day_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES city_states(id) ON DELETE CASCADE,
    city_day INT NOT NULL,
    summary_text TEXT NOT NULL,
    highlights JSONB DEFAULT '[]', -- Array of key events
    mood_trajectory VARCHAR(50),
    notable_npcs UUID[] DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, city_day)
);

-- NPC Dialogues (Chat history)
CREATE TABLE npc_dialogues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    npc_response TEXT NOT NULL,
    emotion_expressed VARCHAR(50),
    relationship_change INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. ECONOMY & FINANCE
-- ============================================================================

CREATE TABLE npc_finances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(15, 2) DEFAULT 5000.0,
    monthly_rent DECIMAL(10, 2) DEFAULT 800.0,
    monthly_expenses DECIMAL(10, 2) DEFAULT 500.0,
    emergency_fund DECIMAL(15, 2) DEFAULT 2000.0,
    debt DECIMAL(15, 2) DEFAULT 0.0,
    last_payment_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. WORLD STATE & SIMULATION
-- ============================================================================

CREATE TABLE simulation_ticks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES city_states(id) ON DELETE CASCADE,
    tick_number INT NOT NULL,
    tick_duration_seconds INT DEFAULT 60, -- Duration of 1 hour in-game
    processed_npcs INT DEFAULT 0,
    events_generated INT DEFAULT 0,
    execution_time_ms INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, tick_number)
);

-- ============================================================================
-- 6. ADMIN & TRACKING
-- ============================================================================

CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    changes JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT,
    response_time_ms INT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary query indexes
CREATE INDEX idx_city_id ON city_states(name);
CREATE INDEX idx_npcs_city ON npcs(city_id);
CREATE INDEX idx_npcs_current_place ON npcs(current_place_id);
CREATE INDEX idx_npc_relationships ON npc_relationships(npc_id, other_npc_id);
CREATE INDEX idx_life_events_city ON life_events(city_id, city_day);
CREATE INDEX idx_life_events_npc ON life_events(npc_main_id);
CREATE INDEX idx_gossips_city ON gossips(city_id, created_at);
CREATE INDEX idx_day_summaries_city ON day_summaries(city_id, city_day);
CREATE INDEX idx_memories_npc ON npc_memories(npc_id, created_at);
CREATE INDEX idx_routines_npc_hour ON npc_routines(npc_id, hour);
CREATE INDEX idx_simulation_ticks_city ON simulation_ticks(city_id, tick_number);
CREATE INDEX idx_api_logs_endpoint ON api_access_logs(endpoint, created_at);
CREATE INDEX idx_neighborhoods_city ON neighborhoods(city_id);
CREATE INDEX idx_places_neighborhood ON places(neighborhood_id);

-- Full text search indexes
CREATE INDEX idx_npc_names ON npcs USING GIN (to_tsvector('spanish', name));
CREATE INDEX idx_place_names ON places USING GIN (to_tsvector('spanish', name));
CREATE INDEX idx_gossips_text ON gossips USING GIN (to_tsvector('spanish', text));

-- ============================================================================
-- 8. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_city_states
BEFORE UPDATE ON city_states FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_npcs
BEFORE UPDATE ON npcs FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_neighborhoods
BEFORE UPDATE ON neighborhoods FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_places
BEFORE UPDATE ON places FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Delete associated gossips when event is deleted
CREATE OR REPLACE FUNCTION delete_event_gossips()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM gossips WHERE event_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_event_gossips
BEFORE DELETE ON life_events FOR EACH ROW
EXECUTE FUNCTION delete_event_gossips();

-- Update neighborhood happiness when NPCs change
CREATE OR REPLACE FUNCTION update_neighborhood_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE neighborhoods
    SET updated_at = CURRENT_TIMESTAMP,
        population_count = (SELECT COUNT(*) FROM npcs WHERE home_neighborhood_id = NEW.home_neighborhood_id)
    WHERE id = NEW.home_neighborhood_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_neighborhood_stats
AFTER INSERT OR UPDATE ON npcs FOR EACH ROW
WHEN (NEW.home_neighborhood_id IS NOT NULL)
EXECUTE FUNCTION update_neighborhood_stats();

-- Ensure relationship symmetry consistency
CREATE OR REPLACE FUNCTION validate_relationship_symmetry()
RETURNS TRIGGER AS $$
BEGIN
    -- This is a soft validation; actual enforcement depends on application logic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. INITIAL DATA (Optional starter city)
-- ============================================================================

-- Create main city
INSERT INTO city_states (name, current_time, current_day, mood_index)
VALUES ('ALEXVERSE', 8, 0, 60)
ON CONFLICT (name) DO NOTHING;

-- Get city ID for reference
DO $$
DECLARE
    city_id UUID;
BEGIN
    SELECT id INTO city_id FROM city_states WHERE name = 'ALEXVERSE' LIMIT 1;
    
    -- Create initial weather
    INSERT INTO weather_states (city_id, type, temperature, humidity, intensity)
    VALUES (city_id, 'soleado', 22, 60, 30)
    ON CONFLICT DO NOTHING;
    
    -- Create neighborhoods
    INSERT INTO neighborhoods (city_id, name, type, wealth_level, safety_level, happiness_level)
    VALUES 
        (city_id, 'Downtown', 'comercial', 70, 65, 65),
        (city_id, 'Suburbs', 'residencial', 60, 75, 70),
        (city_id, 'Entertainment District', 'entretenimiento', 65, 50, 75),
        (city_id, 'Industrial Zone', 'industrial', 30, 40, 35)
    ON CONFLICT (city_id, name) DO NOTHING;
END $$;

-- ============================================================================
-- 10. VIEWS FOR COMMON QUERIES
-- ============================================================================

CREATE OR REPLACE VIEW v_npc_status AS
SELECT 
    n.id,
    n.name,
    n.age,
    n.occupation,
    n.mood_state,
    n.energy_level,
    n.current_place_id,
    p.name as current_place_name,
    nb.name as neighborhood_name,
    nf.balance
FROM npcs n
LEFT JOIN places p ON n.current_place_id = p.id
LEFT JOIN neighborhoods nb ON n.home_neighborhood_id = nb.id
LEFT JOIN npc_finances nf ON n.id = nf.npc_id;

CREATE OR REPLACE VIEW v_city_status AS
SELECT 
    cs.id,
    cs.name,
    cs.current_time,
    cs.current_day,
    cs.mood_index,
    cs.drama_level,
    ws.type as weather_type,
    ws.temperature,
    COUNT(DISTINCT n.id) as total_npcs
FROM city_states cs
LEFT JOIN weather_states ws ON cs.weather_state_id = ws.id
LEFT JOIN npcs n ON cs.id = n.city_id
GROUP BY cs.id, cs.name, cs.current_time, cs.current_day, cs.mood_index, cs.drama_level, ws.type, ws.temperature;

CREATE OR REPLACE VIEW v_recent_events AS
SELECT 
    le.id,
    le.event_type,
    le.city_day,
    le.city_time,
    le.severity,
    nb.name as neighborhood_name,
    n_main.name as main_npc_name,
    n_other.name as other_npc_name,
    le.description,
    le.created_at
FROM life_events le
LEFT JOIN neighborhoods nb ON le.neighborhood_id = nb.id
LEFT JOIN npcs n_main ON le.npc_main_id = n_main.id
LEFT JOIN npcs n_other ON le.npc_other_id = n_other.id
ORDER BY le.created_at DESC
LIMIT 100;

-- ============================================================================
-- DONE: Schema ready for ALEXVERSE Life
-- ============================================================================
