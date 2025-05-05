import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

// Sphere component representing a data point
function DataPoint({ position, color, size, data }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={hovered ? size * 1.2 : size}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshPhongMaterial 
        color={color} 
        transparent
        opacity={0.8}
        shininess={100}
      />
      {hovered && (
        <Html>
          <div className="bg-black/80 text-white p-2 rounded-lg text-xs">
            <p>Time: {data.time}</p>
            <p>Loss: {data.loss}</p>
          </div>
        </Html>
      )}
    </mesh>
  );
}

// Grid component
function Grid() {
  return (
    <gridHelper 
      args={[20, 10]} 
      position={[0, -2, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// Main 3D visualization component
function TrainingProgress3D({ data }) {
  const normalizedData = data.map((point, index) => ({
    position: [
      (point.time / 10) - 3,  // X position
      (point.trainLoss / 10) - 2,  // Y position
      (point.validationLoss / 10) - 2  // Z position
    ],
    color: `hsl(${(index * 60) % 360}, 70%, 50%)`,
    size: 0.3 + (index * 0.1),
    data: {
      time: point.time,
      loss: point.trainLoss
    }
  }));

  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 75 }}
        style={{ background: '#111827' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <fog attach="fog" args={['#111827', 10, 20]} />
        
        {/* Data points */}
        {normalizedData.map((point, index) => (
          <DataPoint
            key={index}
            position={point.position}
            color={point.color}
            size={point.size}
            data={point.data}
          />
        ))}
        
        <Grid />
        <OrbitControls enableZoom={true} />
        
        {/* Axis labels */}
        <Html position={[5, 0, 0]}>
          <div className="text-white">Time →</div>
        </Html>
        <Html position={[0, 5, 0]}>
          <div className="text-white">Loss ↑</div>
        </Html>
      </Canvas>
    </div>
  );
}

export default TrainingProgress3D;