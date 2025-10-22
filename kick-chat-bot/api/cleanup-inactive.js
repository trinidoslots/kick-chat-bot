import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    // Delete users who haven't messaged in 3+ minutes
    const { error } = await supabase
      .from('active_users')
      .delete()
      .lt('last_message_at', new Date(Date.now() - 3 * 60 * 1000).toISOString());

    if (error) {
      console.error('Cleanup error:', error);
      return res.status(500).json({ error: 'Cleanup failed' });
    }

    // Get current active user count
    const { count } = await supabase
      .from('active_users')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({ 
      success: true,
      active_users: count,
      cleaned_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}