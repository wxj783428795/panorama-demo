"use client";
import React, { useRef, useState, useLayoutEffect } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, useTexture, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// Extend shaderMaterial to be used in JSX
const PanoramaTransitionMaterial = shaderMaterial(
  {
    mixFactor: 0.0,
    texture1: new THREE.Texture(),
    texture2: new THREE.Texture(),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float mixFactor;
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    varying vec2 vUv;

    void main() {
      vec4 tex1 = texture2D(texture1, vUv);
      vec4 tex2 = texture2D(texture2, vUv);
      gl_FragColor = mix(tex1, tex2, mixFactor);
    }
  `
);

extend({ PanoramaTransitionMaterial });

// 标识物组件
const Marker = ({ position, onClick }: { position: THREE.Vector3; onClick: (position: THREE.Vector3) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Create an arrow shape
  const arrowShape = new THREE.Shape();
  // Define arrow dimensions
  const width = 20;
  const length = 40;
  const headWidth = 40;
  const headLength = 20;

  // Define arrow path
  arrowShape.moveTo(-width / 2, 0);
  arrowShape.lineTo(-width / 2, length - headLength);
  arrowShape.lineTo(-headWidth / 2, length - headLength);
  arrowShape.lineTo(0, length);
  arrowShape.lineTo(headWidth / 2, length - headLength);
  arrowShape.lineTo(width / 2, length - headLength);
  arrowShape.lineTo(width / 2, 0);
  arrowShape.closePath();

  useLayoutEffect(() => {
    if (meshRef.current) {
      // The normal to the sphere at `position` is the direction of `position` itself.
      const normal = position.clone().normalize();
      // The default normal of the shape (which is in the XY plane) is along the Z axis.
      const defaultNormal = new THREE.Vector3(0, 1, 1);
      // Create a quaternion to rotate from the default normal to the sphere normal.
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        defaultNormal,
        normal
      );
      // Apply the rotation.
      meshRef.current.quaternion.copy(quaternion);
    }
  }, [position]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation(); // 阻止事件冒泡到球体
        onClick(e.object.position);
      }}
    >
      <shapeGeometry args={[arrowShape]} />
      <meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} />
    </mesh>
  );
};

// 全景球体和场景逻辑组件
const SceneContent = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const controlsRef = useRef<any>(null!);
  const materialRef = useRef<any>(null!);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(1);
  const [currentTextureIndex, setCurrentTextureIndex] = useState(0);

  const textures = useTexture(['/2.jpg', '/1.jpg']);

  // 点击标识物的处理函数
  const handleMarkerClick = (position: THREE.Vector3) => {
    // setTargetPosition(position.clone().multiplyScalar(0.1));
    // setIsAnimating(true);
    setIsTransitioning(true);
    setTransitionDirection(currentTextureIndex === 0 ? 1 : -1);
  };

  useFrame((state, delta) => {
    if (isAnimating && targetPosition) {
      state.camera.position.lerp(targetPosition, 0.05);
      if (state.camera.position.distanceTo(targetPosition) < 0.01) {
        setIsAnimating(false);
        setTargetPosition(null);
      }
    } else if (controlsRef.current) {
      if (!controlsRef.current.getAzimuthalAngle) return;
      const isUserInteracting = controlsRef.current.getAzimuthalAngle() !== 0 || controlsRef.current.getPolarAngle() !== Math.PI / 2;
      if (!isUserInteracting) {
         groupRef.current.rotation.y += delta * 0.1;
      }
    }

    if (isTransitioning && materialRef.current) {
      const targetMixFactor = transitionDirection === 1 ? 1 : 0;
      materialRef.current.mixFactor = THREE.MathUtils.lerp(materialRef.current.mixFactor, targetMixFactor, 0.05);

      if (Math.abs(materialRef.current.mixFactor - targetMixFactor) < 0.01) {
        materialRef.current.mixFactor = targetMixFactor;
        setIsTransitioning(false);
        setCurrentTextureIndex(transitionDirection === 1 ? 1 : 0);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        {/* @ts-ignore */}
        <panoramaTransitionMaterial ref={materialRef} texture1={textures[0]} texture2={textures[1]} side={THREE.BackSide} />
      </mesh>
      <Marker position={new THREE.Vector3(90, -150, -400)} onClick={handleMarkerClick} />
    </group>
  );
};

// 主组件
const PanoramaThree = () => {
  return (
    <div className="w-full h-full">
      <Canvas>
        <SceneContent />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={0.1}
          maxDistance={350}
          rotateSpeed={-0.5}
        />
      </Canvas>
    </div>
  );
};

export default PanoramaThree;
