export const GOOGLE_OAUTH2_CONFIG = {
  clientId: '1060632772856-ln0u98r0jv26n8v6guejnblt5n9lerf1.apps.googleusercontent.com',
  redirectUri: `http://localhost:8080/api/oauth2/callback/google`,
  scope: 'openid profile email',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

export const buildOAuth2Url = (provider: 'google') => {
  const config = provider === 'google' ? GOOGLE_OAUTH2_CONFIG : null;

  if (!config) {
    throw new Error(`Unsupported OAuth2 provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: Math.random().toString(36).substring(7)
  });

  return `${config.authUrl}?${params.toString()}`;
};
