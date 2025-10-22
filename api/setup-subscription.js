export default async function handler(req, res) {
  const { access_token, user_id } = req.query;

  if (!access_token || !user_id) {
    return res.status(400).json({ 
      error: 'Missing parameters',
      usage: 'Call with ?access_token=YOUR_TOKEN&user_id=YOUR_USER_ID'
    });
  }

  try {
    const response = await fetch('https://api.kick.com/public/v1/events/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events: [
          {
            name: 'chat.message.sent',
            version: 1
          }
        ],
        method: 'webhook',
        broadcaster_user_id: user_id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to create subscription',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event subscription created!',
      subscription: data
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: error.message });
  }
}
