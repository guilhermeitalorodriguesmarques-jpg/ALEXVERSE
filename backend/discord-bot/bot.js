#!/usr/bin/env node

/**
 * ALEXVERSE Discord LifeBot
 * Discord bot integration for ALEXVERSE Life simulation
 */

import Discord from 'discord.js';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
});

// ============================================================================
// Configuration
// ============================================================================

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const CORE_API_URL = process.env.CORE_API_URL || 'http://core-api:8000';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '';

// ============================================================================
// API Helper
// ============================================================================

async function callCoreAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${CORE_API_URL}${endpoint}`,
      timeout: 10000,
    };

    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API error: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// Command Handlers
// ============================================================================

async function handleCiudadCommand(message) {
  try {
    const cityState = await callCoreAPI('/api/v1/city/state');
    const neighborhoods = await callCoreAPI('/api/v1/city/neighborhoods');
    const weather = await callCoreAPI('/api/v1/city/weather');

    const embed = new Discord.EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🏙️ ALEXVERSE - Estado de la Ciudad')
      .addFields(
        { name: 'Hora', value: `${cityState.current_time}:00`, inline: true },
        { name: 'Día', value: `${cityState.current_day}`, inline: true },
        { name: 'Clima', value: weather.type || 'Unknown', inline: true },
        { name: 'Estado de Ánimo', value: `${cityState.mood_index}/100`, inline: true },
        { name: 'Temperatura', value: `${weather.temperature}°C`, inline: true },
        { name: 'Nivel de Drama', value: `${cityState.drama_level}/100`, inline: true },
        {
          name: 'Barrios',
          value: neighborhoods.neighborhoods
            .map((n) => `**${n.name}**: Felicidad ${n.happiness_level}/100`)
            .join('\n'),
        }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    await message.reply('Error fetching city state. Try again later.');
  }
}

async function handleChismeCommand(message) {
  try {
    const gossips = await callCoreAPI('/api/v1/gossips?limit=5');

    if (gossips.gossips.length === 0) {
      await message.reply('No hay chismes en la ciudad en este momento.');
      return;
    }

    const gossip = gossips.gossips[Math.floor(Math.random() * gossips.gossips.length)];

    const embed = new Discord.EmbedBuilder()
      .setColor('#ff6b9d')
      .setTitle('🗣️ Chisme del Día')
      .setDescription(gossip.text)
      .addFields(
        { name: 'Intensidad', value: `${gossip.intensity}/100`, inline: true },
        { name: 'Diseminación', value: `${gossip.spread_count} personas lo saben`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    await message.reply('Error fetching gossips. Try again later.');
  }
}

async function handleNPCCommand(message, args) {
  try {
    const npcName = args.slice(1).join(' ');
    if (!npcName) {
      await message.reply('Uso: !npc <nombre_del_npc>');
      return;
    }

    const npcs = await callCoreAPI('/api/v1/npcs?limit=100');
    const npc = npcs.npcs.find((n) => n.name.toLowerCase() === npcName.toLowerCase());

    if (!npc) {
      await message.reply(`NPC "${npcName}" not found.`);
      return;
    }

    const embed = new Discord.EmbedBuilder()
      .setColor('#00aaff')
      .setTitle(`👤 ${npc.name}`)
      .addFields(
        { name: 'Edad', value: `${npc.age}`, inline: true },
        { name: 'Género', value: npc.gender, inline: true },
        { name: 'Ocupación', value: npc.occupation, inline: true },
        { name: 'Estado de Ánimo', value: npc.mood_state, inline: true },
        { name: 'Energía', value: `${npc.energy_level}/100`, inline: true },
        { name: 'Necesidad Social', value: `${npc.social_need}/100`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    await message.reply('Error fetching NPC. Try again later.');
  }
}

async function handleDiaCommand(message) {
  try {
    const summaries = await callCoreAPI('/api/v1/day-summaries?limit=1');

    if (summaries.summaries.length === 0) {
      await message.reply('No hay resumen del día disponible aún.');
      return;
    }

    const summary = summaries.summaries[0];

    const embed = new Discord.EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle(`📖 Resumen del Día ${summary.city_day}`)
      .setDescription(summary.summary_text)
      .addFields({
        name: 'Trayectoria de Ánimo',
        value: summary.mood_trajectory || 'Neutral',
        inline: false,
      })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    await message.reply('Error fetching day summary. Try again later.');
  }
}

async function handleGodCommand(message, args) {
  try {
    if (message.author.id !== ADMIN_USER_ID) {
      await message.reply('❌ Solo el admin puede usar comandos de Modo Dios.');
      return;
    }

    const action = args[1];

    let result;

    switch (action) {
      case 'drama':
        result = await callCoreAPI(
          '/api/v1/god/drama/set?drama_level=80',
          'POST',
          {}
        );
        await message.reply('🎭 ¡Nivel de drama aumentado! La ciudad ahora es más dramática.');
        break;

      case 'fiesta':
        result = await callCoreAPI(
          '/api/v1/god/city/party',
          'POST',
          { neighborhood_id: 'downtown' }
        );
        await message.reply('🎉 ¡Se ha disparado una fiesta masiva en la ciudad!');
        break;

      case 'lluvia':
        result = await callCoreAPI(
          '/api/v1/god/weather/set?weather_type=lluvia&temperature=15',
          'POST',
          {}
        );
        await message.reply('🌧️ El clima ha cambiado a lluvia. ¡Que se mojen todos!');
        break;

      default:
        await message.reply('Comandos disponibles: !modoDios drama, !modoDios fiesta, !modoDios lluvia');
    }
  } catch (error) {
    console.error('God command error:', error);
    await message.reply('❌ Error ejecutando comando de Modo Dios.');
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

client.on('ready', () => {
  console.log(`✅ Discord bot connected as ${client.user.tag}`);
  client.user.setActivity('ALEXVERSE Life', { type: 'PLAYING' });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Parse command
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args[0].toLowerCase();

  console.log(`Command received: ${command}`);

  try {
    switch (command) {
      case 'ciudad':
        await handleCiudadCommand(message);
        break;

      case 'chisme':
        await handleChismeCommand(message);
        break;

      case 'npc':
        await handleNPCCommand(message, args);
        break;

      case 'dia':
        await handleDiaCommand(message);
        break;

      case 'mododios':
        await handleGodCommand(message, args);
        break;

      case 'ayuda':
        const helpEmbed = new Discord.EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('🤖 ALEXVERSE LifeBot - Comandos')
          .addFields(
            { name: '!ciudad', value: 'Ver estado actual de la ciudad' },
            { name: '!chisme', value: 'Escuchar un chisme aleatorio' },
            { name: '!npc <nombre>', value: 'Obtener información de un NPC' },
            { name: '!dia', value: 'Leer el resumen del día' },
            { 
              name: '!mododios <accion>', 
              value: 'Admin: drama | fiesta | lluvia (solo para admin)' 
            }
          );
        await message.reply({ embeds: [helpEmbed] });
        break;

      default:
        await message.reply(`Comando desconocido: ${command}. Usa !ayuda para ver los comandos disponibles.`);
    }
  } catch (error) {
    console.error(`Error handling command: ${error.message}`);
    await message.reply('❌ Hubo un error procesando tu comando.');
  }
});

// ============================================================================
// Bot Start
// ============================================================================

client.login(DISCORD_TOKEN);

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
