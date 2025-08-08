"use client";
import React, { useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

// 标识物组件
const Marker = ({ position, onClick }: { position: THREE.Vector3; onClick: (position: THREE.Vector3) => void }) => {
  const texture = useTexture("/goodwe.png");

  return (
    <sprite
      position={position}
      scale={[132, 20, 1]}
      onClick={(e) => {
        e.stopPropagation(); // 阻止事件冒泡到球体
        console.log('e.object.position', e.object.position)
        onClick(e.object.position);
      }}
    >
      <spriteMaterial map={texture} />
    </sprite>
  );
};

// 全景球体和场景逻辑组件
const SceneContent = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const controlsRef = useRef<any>(null!);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(
    null
  );

  const panoramaTexture = useTexture("/alma.jpg");

  // 点击标识物的处理函数
  const handleMarkerClick = (position: THREE.Vector3) => {
    setTargetPosition(position.clone().normalize().multiplyScalar(0.1)); // 计算目标位置
    setIsAnimating(true);
  };

  // useFrame 会在每一帧执行
  useFrame((state, delta) => {
    if (isAnimating && targetPosition) {
      // 平滑地将相机移动到目标位置
      state.camera.position.lerp(targetPosition, 0.05);

      // 当相机接近目标时停止动画
      if (state.camera.position.distanceTo(targetPosition) < 0.01) {
        setIsAnimating(false);
        setTargetPosition(null);
      }
    } else if (controlsRef.current) {
      // 如果没有动画且用户没有交互，则自动旋转
      if (!controlsRef.current.getAzimuthalAngle) return;
      const isUserInteracting = controlsRef.current.getAzimuthalAngle() !== 0 || controlsRef.current.getPolarAngle() !== Math.PI / 2;
      if (!isUserInteracting) {
         groupRef.current.rotation.y += delta * 0.1; // 自动漫游
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial map={panoramaTexture} side={THREE.BackSide} />
      </mesh>
      <Marker position={new THREE.Vector3(50, 50, -400)} onClick={handleMarkerClick} />
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
          rotateSpeed={-0.5} // 反转拖拽方向以匹配直觉
        />
      </Canvas>
    </div>
  );
};

export default PanoramaThree;