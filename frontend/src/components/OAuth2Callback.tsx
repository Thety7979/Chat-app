import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authApi, { UserDTO } from '../api/authApi';

const OAuth2Callback: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      // Prevent multiple processing
      if (hasProcessed.current) {
        return;
      }

      try {
        // Debug: Log current URL
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        
        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refreshToken');
        const error = urlParams.get('error');
        const code = urlParams.get('code');
        const email = urlParams.get('email');
        const name = urlParams.get('name');
        const picture = urlParams.get('picture');

        console.log('Token:', token);
        console.log('RefreshToken:', refreshToken);
        console.log('Error:', error);
        console.log('Code:', code);
        console.log('Email:', email);
        console.log('Name:', name);
        console.log('Picture:', picture);

        // If no tokens or code, don't process
        if (!token && !refreshToken && !code && !error) {
          console.log('No OAuth2 parameters found, skipping...');
          return;
        }

        // Mark as processed
        hasProcessed.current = true;

        if (error) {
          console.error('OAuth2 error:', error);
          (window as any).showToast('Google login thất bại. Vui lòng thử lại.', 'error');
          navigate('/login');
          return;
        }

        if (token && refreshToken) {
          // Set tokens in authApi
          authApi.setTokens(token, refreshToken);
          
          // Debug: Log received parameters
          console.log('=== OAuth2Callback Debug ===');
          console.log('Email:', email);
          console.log('Name:', name);
          console.log('Picture:', picture);
          console.log('============================');
          
          // Use user info from URL params (provided by backend)
          const userInfo: UserDTO = {
            id: 'google-user',
            email: email || '',
            username: email ? email.split('@')[0] : 'google-user',
            displayName: name || (email ? email.split('@')[0] : 'Google User'), // Use name from URL params
            avatarUrl: picture || '', // Use picture from URL params
            about: '',
            isActive: true,
            lastSeenAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };
          
          console.log('Created userInfo:', userInfo);
          
          // Set user in auth context
          setUser(userInfo);
          
          navigate('/chat');
        } else if (code) {
          // If we have authorization code, call backend API
          try {
            const response = await authApi.googleOAuth2(code);
            
            // Set tokens in authApi
            authApi.setTokens(response.token, response.refreshToken);
            
            // Set user in auth context
            setUser(response.user);
            
            navigate('/chat');
          } catch (apiError) {
            console.error('API error:', apiError);
            (window as any).showToast('Có lỗi xảy ra khi xử lý đăng nhập Google.', 'error');
            navigate('/login');
          }
        } else {
          console.error('No tokens or code received');
          (window as any).showToast('Không nhận được thông tin đăng nhập từ Google.', 'error');
          navigate('/login');
        }
      } catch (error) {
        console.error('OAuth2 callback error:', error);
        (window as any).showToast('Có lỗi xảy ra khi xử lý đăng nhập Google.', 'error');
        navigate('/login');
      }
    };

    handleOAuth2Callback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;
