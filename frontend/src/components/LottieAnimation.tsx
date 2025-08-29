import React from 'react';
import Lottie from 'lottie-react';

// Simple loading animation data (you can replace with actual Lottie JSON)
const loadingAnimation = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 180,
  w: 200,
  h: 200,
  nm: "Loading",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] }, { t: 180, s: [360] }] },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [80, 80] },
              p: { a: 0, k: [0, 0] }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.42, 0.43, 0.92, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 8 },
              lc: 2,
              lj: 1
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 }
            }
          ],
          nm: "Ellipse 1",
          mn: "ADBE Vector Group",
          hd: false
        }
      ],
      ip: 0,
      op: 180,
      st: 0,
      bm: 0
    }
  ]
};

interface LottieAnimationProps {
  type: 'loading' | 'success' | 'error';
  size?: number;
  className?: string;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({ 
  type, 
  size = 100, 
  className = '' 
}) => {
  const getAnimationData = () => {
    switch (type) {
      case 'loading':
        return loadingAnimation;
      case 'success':
        // You can add success animation data here
        return loadingAnimation;
      case 'error':
        // You can add error animation data here
        return loadingAnimation;
      default:
        return loadingAnimation;
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        animationData={getAnimationData()}
        loop={type === 'loading'}
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default LottieAnimation;
