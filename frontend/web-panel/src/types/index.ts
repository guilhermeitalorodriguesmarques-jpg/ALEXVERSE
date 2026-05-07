export interface NPC {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  mood_state: string;
  energy_level: number;
  social_need: number;
  current_place_id?: string;
  home_neighborhood_id?: string;
  personality_profile: Record<string, number>;
}

export interface CityState {
  id: string;
  name: string;
  current_time: number;
  current_day: number;
  mood_index: number;
  drama_level: number;
  romance_level: number;
  conflict_level: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  type: string;
  wealth_level: number;
  safety_level: number;
  happiness_level: number;
  population_count: number;
}

export interface LifeEvent {
  id: string;
  event_type: string;
  city_day: number;
  city_time: number;
  severity: number;
  neighborhood_name?: string;
  main_npc_name?: string;
  other_npc_name?: string;
  description: string;
}

export interface Gossip {
  id: string;
  text: string;
  intensity: number;
  spread_count: number;
  created_at: string;
}

export interface DaySummary {
  id: string;
  city_day: number;
  summary_text: string;
  mood_trajectory: string;
}

export interface Weather {
  type: string;
  temperature: number;
  humidity: number;
  intensity: number;
}
