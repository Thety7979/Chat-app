import React, { useState, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ThreeDBackground from './ThreeDBackground';

const AnimatedSignUpPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (email.trim()) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(1);
        setTimeout(() => {
          alert('Sign up successful! Please check your email.');
          setCurrentStep(0);
        }, 2000);
      }, 2000);
    }
  };

  const handleSocialSignUp = (provider: string): void => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`Sign up with ${provider} successful!`);
    }, 1500);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
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

  const successVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    }
  };

  return (
    <>
      <ThreeDBackground />
      
             <div className="min-h-screen flex items-center justify-center relative z-10 bg-white">
         <motion.div 
           className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-white/90 backdrop-blur-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left side */}
          <motion.div 
            className="relative bg-gradient-to-br from-accent to-purple-100 flex-1 p-10 md:p-16 flex flex-col justify-between"
            variants={itemVariants}
          >
            {/* Animated circle shapes */}
            <motion.div 
              className="absolute top-10 left-6 w-24 h-24 rounded-full bg-teal-200 opacity-60"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div 
              className="absolute top-16 right-6 w-16 h-16 rounded-full bg-pink-200 opacity-60"
              animate={{ 
                y: [0, 15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary opacity-30"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-primary opacity-40"
              animate={{ 
                rotate: [0, -360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 30, 
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary opacity-40"
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div 
              className="absolute top-[45%] left-[22%] w-5 h-5 rounded-full bg-pink-400"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Images in shapes */}
            <motion.div 
              className="relative z-10 flex flex-wrap justify-center md:justify-start gap-6"
              variants={itemVariants}
            >
              <motion.div 
                className="w-28 h-28 rounded-[50%_50%_50%_0] overflow-hidden"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
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
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
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
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
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
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img 
                  alt="Portrait of a man holding a hat with a beige background" 
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
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
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
                Nice to see you!
              </motion.h3>
              
              {/* Social Sign Up Buttons */}
              <motion.button 
                className="w-full mb-4 py-3 border border-google-red rounded-lg text-google-red font-medium flex items-center justify-center gap-2 hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed" 
                type="button"
                onClick={() => handleSocialSignUp('Google')}
                disabled={isLoading}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <i className="fab fa-google"></i>
                {isLoading ? 'Signing up...' : 'Sign up with Google'}
              </motion.button>
              
              <motion.button 
                className="w-full mb-4 py-3 border border-facebook-blue rounded-lg text-facebook-blue font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed" 
                type="button"
                onClick={() => handleSocialSignUp('Facebook')}
                disabled={isLoading}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <i className="fab fa-facebook-f"></i>
                {isLoading ? 'Signing up...' : 'Sign up with Facebook'}
              </motion.button>
              
              <motion.button 
                className="w-full mb-6 py-3 border border-microsoft-black rounded-lg text-microsoft-black font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed" 
                type="button"
                onClick={() => handleSocialSignUp('Microsoft')}
                disabled={isLoading}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <img 
                  alt="Microsoft logo with four colored squares" 
                  className="w-4 h-4" 
                  height="16" 
                  src="https://storage.googleapis.com/a1aa/image/969f29ff-cde9-4e01-7f18-b16a84dabc2f.jpg" 
                  width="16"
                />
                {isLoading ? 'Signing up...' : 'Sign up with Microsoft'}
              </motion.button>
              
              <motion.div 
                className="flex items-center mb-6"
                variants={itemVariants}
              >
                <hr className="flex-grow border-t border-border-gray" />
                <span className="mx-3 text-xs text-text-gray font-semibold">OR</span>
                <hr className="flex-grow border-t border-border-gray" />
              </motion.div>
              
              {/* Email Sign Up Form */}
              <motion.form 
                onSubmit={handleEmailSubmit}
                variants={itemVariants}
              >
                <motion.label 
                  className="block mb-2 text-sm text-text-gray font-normal" 
                  htmlFor="email"
                  variants={itemVariants}
                >
                  Sign up with your email
                </motion.label>
                
                <motion.input 
                  className="w-full mb-4 py-3 px-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition" 
                  id="email" 
                  placeholder="email@gmail.com" 
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                
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
                
                <motion.button 
                  className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed" 
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {isLoading ? 'Signing up...' : 'Continue'}
                </motion.button>
              </motion.form>
              
              <motion.p 
                className="mt-6 text-center text-xs text-text-gray"
                variants={itemVariants}
              >
                Existing member?
                <a className="font-semibold text-primary hover:underline ml-1" href="#">
                  Sign in
                </a>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {currentStep === 1 && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-green-500 text-white p-8 rounded-full"
                variants={successVariants}
                initial="hidden"
                animate="visible"
              >
                <i className="fas fa-check text-4xl"></i>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AnimatedSignUpPage;
