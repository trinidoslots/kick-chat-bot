import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;

    // Verify it's a chat message event
    if (event.type !== 'chat.message.sent') {
      return res.status(200).json({ message: 'Event ignored' });
    }

    const {
      id: message_id,
      user,
      content,
      channel_id,
    } = event.data;

    // Insert chat message
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        message_id: message_id,
        username: user.username,
        user_id: user.id.toString(),
        message_content: content,
        channel_id: channel_id.toString(),
      });

    if (messageError && messageError.code !== '23505') {
      // Ignore duplicate key errors (23505)
      console.error('Error inserting message:', messageError);
    }

    // Update active users
    const { error: activeError } = await supabase
      .rpc('update_active_user', {
        p_user_id: user.id.toString(),
        p_username: user.username,
      });

    if (activeError) {
      console.error('Error updating active user:', activeError);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Chat message processed' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}