export default async function handler(req, res) {
  const client_id = process.env.KICK_CLIENT_ID;
  const client_secret = process.env.KICK_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return res.status(400).json({ 
      error: 'Missing credentials in environment variables' 
    });
  }

  try {
    // Try OAuth token endpoint
    const response = await fetch('https://kick.com/oauth2/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: client_id,
        client_secret: client_secret,
        grant_type: 'client_credentials',
        scope: 'events:subscribe'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get token',
        details: data
      });
    }

    return res.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}