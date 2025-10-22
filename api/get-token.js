export default async function handler(req, res) {
  const client_id = process.env.KICK_CLIENT_ID;
  const client_secret = process.env.KICK_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return res.status(400).json({ 
      error: 'Missing KICK_CLIENT_ID and KICK_CLIENT_SECRET environment variables' 
    });
  }

  try {
    // Correct OAuth endpoint
    const response = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: client_id,
        client_secret: client_secret
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get token',
        status: response.status,
        details: data
      });
    }

    return res.json({
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
