import React, { useState, FormEvent, ChangeEvent } from 'react';
import '../assets/SignUpPage.css';

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (email.trim()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        alert('Sign up successful! Please check your email.');
      }, 2000);
    }
  };

  const handleSocialSignUp = (provider: string): void => {
    setIsLoading(true);
    // Simulate social login
    setTimeout(() => {
      setIsLoading(false);
      alert(`Sign up with ${provider} successful!`);
    }, 1500);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-6xl w-full rounded-md shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Left side */}
        <div className="relative bg-accent flex-1 p-10 md:p-16 flex flex-col justify-between">
          {/* Circle shapes */}
          <div aria-hidden="true" className="absolute top-10 left-6 w-24 h-24 rounded-full bg-teal-200 opacity-60"></div>
          <div aria-hidden="true" className="absolute top-16 right-6 w-16 h-16 rounded-full bg-pink-200 opacity-60"></div>
          <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary opacity-30"></div>
          <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-primary opacity-40"></div>
          <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary opacity-40"></div>
          <div aria-hidden="true" className="absolute top-[45%] left-[22%] w-5 h-5 rounded-full bg-pink-400"></div>
          
          {/* Images in shapes */}
          <div className="relative z-10 flex flex-wrap justify-center md:justify-start gap-6">
            <div className="w-28 h-28 rounded-[50%_50%_50%_0] overflow-hidden">
              <img 
                alt="Portrait of a smiling woman with curly hair touching her face, wearing a white tank top" 
                className="w-full h-full object-cover" 
                height="112" 
                src="https://storage.googleapis.com/a1aa/image/4b5eb77f-bfe0-4f6a-83d8-bf79c96a911c.jpg" 
                width="112"
              />
            </div>
            <div className="w-44 h-44 rounded-[50%_50%_0_50%] overflow-hidden">
              <img 
                alt="Portrait of a smiling woman with braided hair and yellow background" 
                className="w-full h-full object-cover" 
                height="176" 
                src="https://storage.googleapis.com/a1aa/image/3d96fa49-e22a-4de3-6345-a261da875052.jpg" 
                width="176"
              />
            </div>
            <div className="w-20 h-20 rounded-[50%_0_50%_50%] overflow-hidden">
              <img 
                alt="Portrait of a smiling man wearing a cap with a red background" 
                className="w-full h-full object-cover" 
                height="80" 
                src="https://storage.googleapis.com/a1aa/image/e93c75be-cc74-4064-365d-1c4a350c23ec.jpg" 
                width="80"
              />
            </div>
            <div className="w-36 h-36 rounded-[0_50%_50%_50%] overflow-hidden">
              <img 
                alt="Portrait of a man holding a hat with a beige background" 
                className="w-full h-full object-cover" 
                height="144" 
                src="https://storage.googleapis.com/a1aa/image/b83619c4-28a2-405e-7ea6-8300b3065414.jpg" 
                width="144"
              />
            </div>
          </div>
          
          {/* Text */}
          <h2 className="mt-12 text-primary text-3xl font-semibold max-w-xs leading-snug">
            Building Bridges, Connecting Communities
          </h2>
        </div>

        {/* Right side */}
        <div className="flex-1 bg-white p-10 md:p-16 flex flex-col items-center">
          <div className="max-w-md w-full">
            <div className="flex justify-center mb-6">
              <div className="bg-secondary rounded-full p-3">
                <i className="fas fa-comment-dots text-white text-xl"></i>
              </div>
            </div>
            
            <h3 className="text-center font-semibold text-lg mb-8">
              Nice to see you!
            </h3>
            
            {/* Social Sign Up Buttons */}
            <button 
              className="w-full mb-4 py-3 border border-google-red rounded-lg text-google-red font-medium flex items-center justify-center gap-2 hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed" 
              type="button"
              onClick={() => handleSocialSignUp('Google')}
              disabled={isLoading}
            >
              <i className="fab fa-google"></i>
              {isLoading ? 'Signing up...' : 'Sign up with Google'}
            </button>
            
            <button 
              className="w-full mb-4 py-3 border border-facebook-blue rounded-lg text-facebook-blue font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed" 
              type="button"
              onClick={() => handleSocialSignUp('Facebook')}
              disabled={isLoading}
            >
              <i className="fab fa-facebook-f"></i>
              {isLoading ? 'Signing up...' : 'Sign up with Facebook'}
            </button>
            
            <button 
              className="w-full mb-6 py-3 border border-microsoft-black rounded-lg text-microsoft-black font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed" 
              type="button"
              onClick={() => handleSocialSignUp('Microsoft')}
              disabled={isLoading}
            >
              <img 
                alt="Microsoft logo with four colored squares" 
                className="w-4 h-4" 
                height="16" 
                src="https://storage.googleapis.com/a1aa/image/969f29ff-cde9-4e01-7f18-b16a84dabc2f.jpg" 
                width="16"
              />
              {isLoading ? 'Signing up...' : 'Sign up with Microsoft'}
            </button>
            
            <div className="flex items-center mb-6">
              <hr className="flex-grow border-t border-border-gray" />
              <span className="mx-3 text-xs text-text-gray font-semibold">OR</span>
              <hr className="flex-grow border-t border-border-gray" />
            </div>
            
            {/* Email Sign Up Form */}
            <form onSubmit={handleEmailSubmit}>
              <label className="block mb-2 text-sm text-text-gray font-normal" htmlFor="email">
                Sign up with your email
              </label>
              <input 
                className="w-full mb-4 py-3 px-4 rounded-lg bg-light-gray placeholder:text-text-gray text-text-gray focus:outline-none focus:ring-2 focus:ring-primary transition" 
                id="email" 
                placeholder="email@gmail.com" 
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
              />
              
              <p className="text-xs text-text-gray mb-6">
                By continuing, you agree to our
                <a className="font-semibold text-primary hover:underline ml-1" href="#">
                  Terms & Conditions
                </a>
                and
                <a className="font-semibold text-primary hover:underline ml-1" href="#">
                  Privacy Policy
                </a>
              </p>
              
              <button 
                className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? 'Signing up...' : 'Continue'}
              </button>
            </form>
            
            <p className="mt-6 text-center text-xs text-text-gray">
              Existing member?
              <a className="font-semibold text-primary hover:underline ml-1" href="#">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
