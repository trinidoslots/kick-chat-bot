import Pusher from 'pusher-js';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration
const KICK_CHANNEL = process.env.KICK_CHANNEL || 'trinidoslots';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Get channel info from Kick API
async function getChannelInfo(channelSlug) {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${channelSlug}`);
    const data = await response.json();
    return {
      chatroom_id: data.chatroom.id,
      user_id: data.user_id,
      username: data.user.username
    };
  } catch (error) {
    console.error('Error fetching channel info:', error);
    throw error;
  }
}

// Store message in database
async function storeMessage(messageData) {
  try {
    // Insert chat message
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        message_id: messageData.id,
        username: messageData.sender.username,
        user_id: messageData.sender.id.toString(),
        message_content: messageData.content,
        channel_slug: KICK_CHANNEL,
      });

    if (messageError && messageError.code !== '23505') {
      console.error('Error inserting message:', messageError);
    }

    // Update active users
    const { error: activeError } = await supabase
      .rpc('update_active_user', {
        p_user_id: messageData.sender.id.toString(),
        p_username: messageData.sender.username,
      });

    if (activeError) {
      console.error('Error updating active user:', activeError);
    }

    console.log(`✅ Message from ${messageData.sender.username}: ${messageData.content}`);
  } catch (error) {
    console.error('Error storing message:', error);
  }
}

// Cleanup inactive users periodically
async function cleanupInactiveUsers() {
  try {
    const { data, error } = await supabase.rpc('cleanup_inactive_users');
    
    if (error) {
      console.error('Cleanup error:', error);
    } else if (data > 0) {
      console.log(`🧹 Cleaned up ${data} inactive users`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Kick Chat Bot...');
  console.log(`📺 Channel: ${KICK_CHANNEL}`);

  // Get channel info
  const channelInfo = await getChannelInfo(KICK_CHANNEL);
  console.log(`✅ Connected to channel: ${channelInfo.username}`);
  console.log(`💬 Chatroom ID: ${channelInfo.chatroom_id}`);

  // Initialize Pusher (Kick uses Pusher for WebSocket)
  const pusher = new Pusher('eb1d5f283081a78b932c', {
    cluster: 'us2',
    enabledTransports: ['ws', 'wss']
  });

  // Subscribe to chatroom channel
  const channel = pusher.subscribe(`chatrooms.${channelInfo.chatroom_id}.v2`);

  // Listen for chat messages
  channel.bind('App\\Events\\ChatMessageEvent', (data) => {
    storeMessage(data);
  });

  // Handle connection events
  pusher.connection.bind('connected', () => {
    console.log('✅ Connected to Kick WebSocket');
  });

  pusher.connection.bind('disconnected', () => {
    console.log('❌ Disconnected from Kick WebSocket');
  });

  pusher.connection.bind('error', (err) => {
    console.error('WebSocket error:', err);
  });

  // Cleanup inactive users every 3 minutes
  setInterval(cleanupInactiveUsers, 3 * 60 * 1000);

  console.log('✅ Bot is now listening for messages!');
}

// Start the bot
main().catch(console.error);

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bot...');
  process.exit(0);
});