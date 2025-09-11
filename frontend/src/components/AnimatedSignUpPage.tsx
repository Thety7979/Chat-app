import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThreeDBackground from './ThreeDBackground';
import LottieAnimation from './LottieAnimation';
import { useAuth } from '../contexts/AuthContext';
import { SignupRequest } from '../api/authApi';
import authApi from '../api/authApi';
import { GOOGLE_OAUTH2_CONFIG } from '../config/oauth2';

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
  const [showPassword, setShowPassword] = useState<boolean>(false);

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

      <div className="h-screen overflow-hidden relative z-10 bg-gradient-to-br from-white via-purple-50 to-teal-50">
        <motion.div
          className="relative w-full min-h-screen"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Fullscreen decorative layer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-accent to-purple-100 p-10 md:p-16 pointer-events-none overflow-hidden"
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

            {/* Hero heading (VI) */}
            <motion.h2
              className="mt-12 text-gray-900 text-4xl md:text-5xl font-extrabold max-w-xl leading-tight tracking-tight"
              variants={itemVariants}
            >
              Kết nối mọi người,
              <br className="hidden md:block" />
              Xây dựng cộng đồng
            </motion.h2>

            {/* Extra Lottie chat visuals around hero */}
            <motion.div
              className="absolute md:left-8 md:top-64 left-4 top-72 opacity-70"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <LottieAnimation type="loading" size={110} />
            </motion.div>

            <motion.div
              className="absolute md:left-72 md:top-40 left-40 top-40 opacity-60"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            >
              <LottieAnimation type="loading" size={90} />
            </motion.div>

            {/* Lottie 3D chat visuals */}
            <motion.div
              className="absolute -bottom-6 left-6 opacity-70"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <LottieAnimation type="loading" size={160} />
            </motion.div>

            <motion.div
              className="absolute top-24 right-10 opacity-60"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <LottieAnimation type="loading" size={120} />
            </motion.div>
 
          </motion.div>

          {/* Foreground form overlay */}
          <motion.div
            className="relative z-10 h-screen flex items-center justify-center md:justify-end p-6 md:p-16 overflow-visible"
            variants={itemVariants}
          >
            <div className="max-w-md w-full rounded-2xl bg-white/20 backdrop-blur-2xl border border-white/30 ring-1 ring-white/20 shadow-xl p-5 md:p-7 md:mr-8 lg:mr-20">
              <motion.div
                className="flex justify-between items-center mb-6"
                variants={itemVariants}
              >
                <motion.div
                  className="bg-secondary rounded-full p-3 shadow-md"
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

                {/* 3D floating chat bubble */}
                <motion.div style={{ perspective: 800 }} className="hidden md:block">
                  <motion.div
                    className="w-12 h-12 rounded-full grid place-items-center bg-gradient-to-br from-primary to-accent shadow-xl"
                    animate={{ rotateY: [0, 20, 0, -20, 0], rotateX: [0, 10, 0, -10, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <i className="fas fa-comment text-white"></i>
                  </motion.div>
                </motion.div>

                {/* Secondary Lottie by form card */}
                <div className="hidden md:block ml-3">
                  <LottieAnimation type="loading" size={48} />
                </div>
              </motion.div>

              {/* Removed welcome text as requested */}

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
                className="w-full mb-4 py-3 border border-google-red/60 rounded-lg text-google-red font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                onClick={handleGoogleOAuth2}
                disabled={isLoading || authLoading}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <i className="fab fa-google"></i>
                {isLoading || authLoading ? 'Đang xử lý...' : 'Đăng nhập bằng Google'}
              </motion.button>

              

              <motion.div
                className="flex items-center mb-6"
                variants={itemVariants}
              >
                <hr className="flex-grow border-t border-border-gray" />
                <span className="mx-3 text-[10px] tracking-wider text-text-gray font-semibold">HOẶC</span>
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
                      className="block mb-2 text-xs text-text-gray font-medium tracking-wide"
                      htmlFor="email"
                      variants={itemVariants}
                    >
                      Đăng nhập bằng email của bạn
                    </motion.label>

                    <motion.div className="relative mb-4" variants={itemVariants}>
                      <input
                        className={`w-full py-3 pl-11 pr-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition ${
                          emailValidated ? 'ring-2 ring-green-500' : ''
                        }`}
                        id="email"
                        placeholder="email@example.com"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-gray/70">
                        <i className="far fa-envelope"></i>
                      </div>
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
                        <motion.div className="relative mb-4" variants={itemVariants}>
                          <input
                            className="w-full py-3 pl-11 pr-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition"
                            placeholder="Username (optional)"
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                          />
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-gray/70">
                            <i className="far fa-user"></i>
                          </div>
                        </motion.div>

                        <motion.div className="relative mb-4" variants={itemVariants}>
                          <input
                            className="w-full py-3 pl-11 pr-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition"
                            placeholder="Full Name (optional)"
                            type="text"
                            value={fullName}
                            onChange={handleFullNameChange}
                          />
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-gray/70">
                            <i className="far fa-id-card"></i>
                          </div>
                        </motion.div>
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
                      {isLoading || authLoading ? 'Đang xử lý...' : 'Tiếp tục'}
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
                      Nhập mật khẩu của bạn
                    </motion.label>

                    <motion.div className="relative mb-4" variants={itemVariants}>
                      <input
                        className="w-full py-3 px-4 pr-12 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition"
                        id="password"
                        placeholder="Enter your password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-gray/70">
                        <i className="far fa-lock"></i>
                      </div>
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-text-gray hover:text-primary"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={`far ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </motion.div>

                    <motion.button
                      className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={isLoading || authLoading || !password.trim()}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {isLoading || authLoading ? 'Đang xử lý...' : (isLoginMode ? 'Đăng nhập' : 'Đăng ký')}
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
