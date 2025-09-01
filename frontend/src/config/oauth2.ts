export const GOOGLE_OAUTH2_CONFIG = {
  clientId: '1060632772856-ln0u98r0jv26n8v6guejnblt5n9lerf1.apps.googleusercontent.com',
  redirectUri: `http://localhost:8080/api/oauth2/callback/google`,
  scope: 'openid profile email',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

export const FACEBOOK_OAUTH2_CONFIG = {
  clientId: 'your-facebook-app-id',
  redirectUri: 'http://localhost:8080/api/oauth2/callback/facebook',
  scope: 'email public_profile',
  authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
  userInfoUrl: 'https://graph.facebook.com/v18.0/me'
};

export const buildOAuth2Url = (provider: 'google' | 'facebook') => {
  const config = provider === 'google' ? GOOGLE_OAUTH2_CONFIG : FACEBOOK_OAUTH2_CONFIG;
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: Math.random().toString(36).substring(7)
  });

  return `${config.authUrl}?${params.toString()}`;
};
