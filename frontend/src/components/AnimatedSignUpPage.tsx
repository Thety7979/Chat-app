import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThreeDBackground from './ThreeDBackground';
import { useAuth } from '../contexts/AuthContext';
import { SignupRequest } from '../api/authApi';
import authApi from '../api/authApi';
import { GOOGLE_OAUTH2_CONFIG, FACEBOOK_OAUTH2_CONFIG } from '../config/oauth2';

const AnimatedSignUpPage: React.FC = () => {
  const { login, signup, isLoading: authLoading, error: authError, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [emailValidated, setEmailValidated] = useState<boolean>(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState<boolean>(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      // Reset form when not authenticated (e.g., after logout)
      setCurrentStep(0);
      setEmail('');
      setPassword('');
      setUsername('');
      setFullName('');
      setEmailValidated(false);
    }
  }, [isAuthenticated, navigate]);

  // Clear auth error when switching modes
  useEffect(() => {
    clearError();
  }, [isLoginMode, clearError]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!validateEmail(email)) {
      (window as any).showToast('Email không hợp lệ', 'error');
      return false;
    }

    setIsCheckingEmail(true);
    try {
      const response = await authApi.checkEmail(email);
      if (response.exists) {
        setEmailValidated(true);
        return true;
      } else {
        (window as any).showToast('Email không tồn tại trong hệ thống', 'error');
        setEmailValidated(false);
        return false;
      }
    } catch (error) {
      (window as any).showToast('Có lỗi xảy ra khi kiểm tra email', 'error');
      setEmailValidated(false);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (email.trim()) {
      setIsLoading(true);
      try {
        // Check email exists for login mode
        if (isLoginMode) {
          const isValid = await checkEmailExists(email);
          if (!isValid) {
            setIsLoading(false);
            return;
          }
        }
        
        setCurrentStep(1);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (password.trim()) {
      setIsLoading(true);
      try {
        if (isLoginMode) {
          // Login
          await login({ email, password });
          // AuthContext will handle redirect via useEffect
        } else {
          // Signup
          const signupData: SignupRequest = {
            email,
            username: username || email.split('@')[0], // Use email prefix as username if not provided
            password,
            displayName: fullName || email.split('@')[0], // Use email prefix as fullName if not provided
          };
          await signup(signupData);
          // AuthContext will handle redirect via useEffect
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // Error is already handled by AuthContext
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleOAuth2 = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const googleAuthUrl = `${GOOGLE_OAUTH2_CONFIG.authUrl}?client_id=${GOOGLE_OAUTH2_CONFIG.clientId}&redirect_uri=${encodeURIComponent(GOOGLE_OAUTH2_CONFIG.redirectUri)}&scope=${encodeURIComponent(GOOGLE_OAUTH2_CONFIG.scope)}&response_type=code&access_type=offline&prompt=consent`;

      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Google OAuth2 error:', error);
      (window as any).showToast('Google login thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookOAuth2 = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const facebookAuthUrl = `${FACEBOOK_OAUTH2_CONFIG.authUrl}?client_id=${FACEBOOK_OAUTH2_CONFIG.clientId}&redirect_uri=${encodeURIComponent(FACEBOOK_OAUTH2_CONFIG.redirectUri)}&scope=${encodeURIComponent(FACEBOOK_OAUTH2_CONFIG.scope)}&response_type=code&state=${Math.random().toString(36).substring(7)}`;

      window.location.href = facebookAuthUrl;
    } catch (error) {
      console.error('Facebook OAuth2 error:', error);
      (window as any).showToast('Facebook login thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    setEmailValidated(false); // Reset validation when email changes
    clearError();
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
    clearError();
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setUsername(e.target.value);
    clearError();
  };

  const handleFullNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFullName(e.target.value);
    clearError();
  };

  const switchToSignup = (): void => {
    setIsLoginMode(false);
    setCurrentStep(0);
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setEmailValidated(false);
    clearError();
  };

  const switchToLogin = (): void => {
    setIsLoginMode(true);
    setCurrentStep(0);
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setEmailValidated(false);
    clearError();
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants: Variants = {
    hover: {
      scale: 1.05,
      y: -2,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const formVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.3 }
    }
  };

  const errorVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      <ThreeDBackground />

      <div className="min-h-screen flex items-center justify-center relative z-10 bg-white">
        <motion.div
          className="w-full h-full flex flex-col md:flex-row bg-white/90 backdrop-blur-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left side */}
          <motion.div
            className="relative bg-gradient-to-br from-accent to-purple-100 flex-1 p-10 md:p-16 flex flex-col justify-between"
            variants={itemVariants}
          >
            {/* Simplified animated shapes - reduced for better performance */}
            <motion.div
              className="absolute top-10 left-6 w-24 h-24 rounded-full bg-teal-200 opacity-60"
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            <motion.div
              className="absolute top-16 right-6 w-16 h-16 rounded-full bg-pink-200 opacity-60"
              animate={{
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />

            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary opacity-30"
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Images in shapes */}
            <motion.div
              className="relative z-10 flex flex-wrap justify-center md:justify-start gap-6"
              variants={itemVariants}
            >
              <motion.div
                className="w-28 h-28 rounded-[50%_50%_50%_0] overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <img
                  alt="Portrait of a smiling woman with curly hair touching her face, wearing a white tank top"
                  className="w-full h-full object-cover"
                  height="112"
                  src="https://storage.googleapis.com/a1aa/image/4b5eb77f-bfe0-4f6a-83d8-bf79c96a911c.jpg"
                  width="112"
                />
              </motion.div>

              <motion.div
                className="w-44 h-44 rounded-[50%_50%_0_50%] overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <img
                  alt="Portrait of a smiling woman with braided hair and yellow background"
                  className="w-full h-full object-cover"
                  height="176"
                  src="https://storage.googleapis.com/a1aa/image/3d96fa49-e22a-4de3-6345-a261da875052.jpg"
                  width="176"
                />
              </motion.div>

              <motion.div
                className="w-20 h-20 rounded-[50%_0_50%_50%] overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <img
                  alt="Portrait of a smiling man wearing a cap with a red background"
                  className="w-full h-full object-cover"
                  height="80"
                  src="https://storage.googleapis.com/a1aa/image/e93c75be-cc74-4064-365d-1c4a350c23ec.jpg"
                  width="80"
                />
              </motion.div>

              <motion.div
                className="w-36 h-36 rounded-[0_50%_50%_50%] overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <img
                  alt="Portrait of a smiling man holding a hat with a beige background"
                  className="w-full h-full object-cover"
                  height="144"
                  src="https://storage.googleapis.com/a1aa/image/b83619c4-28a2-405e-7ea6-8300b3065414.jpg"
                  width="144"
                />
              </motion.div>
            </motion.div>

            {/* Text */}
            <motion.h2
              className="mt-12 text-primary text-3xl font-semibold max-w-xs leading-snug"
              variants={itemVariants}
            >
              Building Bridges, Connecting Communities
            </motion.h2>
          </motion.div>

          {/* Right side */}
          <motion.div
            className="flex-1 bg-white/80 backdrop-blur-sm p-10 md:p-16 flex flex-col items-center"
            variants={itemVariants}
          >
            <div className="max-w-md w-full">
              <motion.div
                className="flex justify-center mb-6"
                variants={itemVariants}
              >
                <motion.div
                  className="bg-secondary rounded-full p-3"
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <i className="fas fa-comment-dots text-white text-xl"></i>
                </motion.div>
              </motion.div>

              <motion.h3
                className="text-center font-semibold text-lg mb-8"
                variants={itemVariants}
              >
                {isLoginMode ? 'Welcome back!' : 'Nice to see you!'}
              </motion.h3>

              {/* Error Display */}
              {authError && (
                <motion.div
                  className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {authError}
                </motion.div>
              )}

              {/* Social Sign Up Buttons */}
              <motion.button
                className="w-full mb-4 py-3 border border-google-red rounded-lg text-google-red font-medium flex items-center justify-center gap-2 hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                onClick={handleGoogleOAuth2}
                disabled={isLoading || authLoading}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <i className="fab fa-google"></i>
                {isLoading || authLoading ? 'Processing...' : `${isLoginMode ? 'Sign in' : 'Sign up'} with Google`}
              </motion.button>

              <motion.button
                className="w-full mb-6 py-3 border border-facebook-blue rounded-lg text-facebook-blue font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                onClick={handleFacebookOAuth2}
                disabled={isLoading || authLoading}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <i className="fab fa-facebook-f"></i>
                {isLoading || authLoading ? 'Processing...' : `${isLoginMode ? 'Sign in' : 'Sign up'} with Facebook`}
              </motion.button>

              <motion.div
                className="flex items-center mb-6"
                variants={itemVariants}
              >
                <hr className="flex-grow border-t border-border-gray" />
                <span className="mx-3 text-xs text-text-gray font-semibold">OR</span>
                <hr className="flex-grow border-t border-border-gray" />
              </motion.div>

              {/* Email Form */}
              <AnimatePresence mode="wait">
                {currentStep === 0 ? (
                  <motion.form
                    key="email-form"
                    onSubmit={handleEmailSubmit}
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.label
                      className="block mb-2 text-sm text-text-gray font-normal"
                      htmlFor="email"
                      variants={itemVariants}
                    >
                      {isLoginMode ? 'Sign in with your email' : 'Sign up with your email'}
                    </motion.label>

                    <motion.div className="relative mb-4" variants={itemVariants}>
                      <input
                        className={`w-full py-3 px-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition ${
                          emailValidated ? 'ring-2 ring-green-500' : ''
                        }`}
                        id="email"
                        placeholder="email@gmail.com"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                      />
                      {isCheckingEmail && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        </div>
                      )}
                      {emailValidated && !isCheckingEmail && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <span className="text-green-500 text-xl">✅</span>
                        </div>
                      )}
                    </motion.div>

                    {emailValidated && (
                      <motion.p
                        className="text-sm text-green-600 mb-4"
                        variants={itemVariants}
                      >
                        Email hợp lệ
                      </motion.p>
                    )}

                    {/* Additional fields for signup */}
                    {!isLoginMode && (
                      <>
                        <motion.input
                          className="w-full mb-4 py-3 px-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition"
                          placeholder="Username (optional)"
                          type="text"
                          value={username}
                          onChange={handleUsernameChange}
                        />

                        <motion.input
                          className="w-full mb-4 py-3 px-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition"
                          placeholder="Full Name (optional)"
                          type="text"
                          value={fullName}
                          onChange={handleFullNameChange}
                        />
                      </>
                    )}

                    {!isLoginMode && (
                      <motion.p
                        className="text-xs text-text-gray mb-6"
                        variants={itemVariants}
                      >
                        By continuing, you agree to our
                        <a className="font-semibold text-primary hover:underline ml-1" href="#">
                          Terms & Conditions
                        </a>
                        and
                        <a className="font-semibold text-primary hover:underline ml-1" href="#">
                          Privacy Policy
                        </a>
                      </motion.p>
                    )}

                    <motion.button
                      className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={isLoading || authLoading || !email.trim()}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {isLoading || authLoading ? 'Processing...' : 'Continue'}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="password-form"
                    onSubmit={handlePasswordSubmit}
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.label
                      className="block mb-2 text-sm text-text-gray font-normal"
                      htmlFor="password"
                      variants={itemVariants}
                    >
                      Enter your password
                    </motion.label>

                    <motion.input
                      className="w-full mb-4 py-3 px-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition"
                      id="password"
                      placeholder="Enter your password"
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />

                    <motion.button
                      className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={isLoading || authLoading || !password.trim()}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {isLoading || authLoading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Sign Up')}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

              <motion.p
                className="mt-6 text-center text-xs text-text-gray"
                variants={itemVariants}
              >
                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                <button
                  className="font-semibold text-primary hover:underline"
                  onClick={isLoginMode ? switchToSignup : switchToLogin}
                >
                  {isLoginMode ? 'Sign up' : 'Sign in'}
                </button>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default AnimatedSignUpPage;
