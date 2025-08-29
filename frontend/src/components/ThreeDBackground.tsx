import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';

// Floating particles component
const FloatingParticles: React.FC = () => {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 100; i++) {
      const time = Math.random() * 100;
      const factor = Math.random() * 20 + 10;
      const speed = Math.random() * 0.01;
      const x = Math.random() * 2000 - 1000;
      const y = Math.random() * 2000 - 1000;
      const z = Math.random() * 2000 - 1000;
      
      temp.push({ time, factor, speed, x, y, z });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particles.forEach((particle, i) => {
        const t = (particle.time + state.clock.elapsedTime * particle.speed) % 100;
        const mesh = particlesRef.current!;
        
        if (mesh) {
          mesh.setMatrixAt(
            i,
            new THREE.Matrix4().setPosition(
              particle.x + Math.cos((t / 100) * Math.PI * 2) * particle.factor,
              particle.y + Math.sin((t / 100) * Math.PI * 2) * particle.factor,
              particle.z
            )
          );
        }
      });
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, 100]}>
      <sphereGeometry args={[2, 8, 8]} />
      <meshBasicMaterial color="#6B6FEA" transparent opacity={0.6} />
    </instancedMesh>
  );
};

// Animated sphere component
const AnimatedSphere: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.5;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 50;
    }
  });

  return (
    <Sphere ref={meshRef} args={[50, 32, 32]} position={[200, 0, 0]}>
      <meshStandardMaterial 
        color="#2CC6B6" 
        transparent 
        opacity={0.3}
        wireframe
      />
    </Sphere>
  );
};

// Main 3D background component
const ThreeDBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 500], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <FloatingParticles />
        <AnimatedSphere />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default ThreeDBackground;
