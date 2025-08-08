"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
const PanoramaThree = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    // 创建场景、相机和渲染器
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // 创建球体几何体
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // 反转球体

    // 加载全景纹理
    const texture = new THREE.TextureLoader().load("/alma.jpg");
    const material = new THREE.MeshBasicMaterial({ map: texture });

    // 创建球体网格
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 创建标识物
    const markerTexture = new THREE.TextureLoader().load("/turborepo-light.svg");
    const markerMaterial = new THREE.SpriteMaterial({ map: markerTexture });
    const marker = new THREE.Sprite(markerMaterial);
    marker.position.set(100, 100, -200); // 设置标识物在3D空间中的位置
    marker.scale.set(320, 20, 1); // 设置标识物的大小
    sphere.add(marker); // 将标识物添加为球体的子对象，使其随球体旋转

    // 设置相机位置
    camera.position.set(0, 0, 0.1);

    // 添加鼠标控制
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isAnimating = false;
    const targetRotation = new THREE.Euler();

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      isAnimating = false; // Stop animation on drag
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };

      const rotationSpeed = 0.005;
      sphere.rotation.y += deltaMove.x * rotationSpeed;
      sphere.rotation.x += deltaMove.y * rotationSpeed;

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = 0.05;
      camera.fov += event.deltaY * zoomSpeed;
      camera.fov = THREE.MathUtils.clamp(camera.fov, 30, 120);
      camera.updateProjectionMatrix();
    };

    const onCanvasClick = (event: MouseEvent) => {
      if (isDragging) return; // Don't trigger on drag end

      mouse.x = (event.clientX / canvas.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / canvas.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(marker);

      if (intersects.length > 0) {
        // Calculate target rotation to look at the marker
        const markerPosition = marker.position.clone();
        const phi = Math.atan2(markerPosition.y, Math.sqrt(markerPosition.x * markerPosition.x + markerPosition.z * markerPosition.z));
        const theta = Math.atan2(markerPosition.x, markerPosition.z);

        targetRotation.x = -phi;
        targetRotation.y = -theta;
        isAnimating = true;
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseUp); // Handle mouse leaving the canvas
    canvas.addEventListener("wheel", onMouseWheel);
    canvas.addEventListener("click", onCanvasClick);


    // 动画循环
    let animationFrameId: number;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      if (isAnimating) {
        sphere.rotation.x = THREE.MathUtils.lerp(sphere.rotation.x, targetRotation.x, 0.05);
        sphere.rotation.y = THREE.MathUtils.lerp(sphere.rotation.y, targetRotation.y, 0.05);

        if (Math.abs(sphere.rotation.y - targetRotation.y) < 0.001 && Math.abs(sphere.rotation.x - targetRotation.x) < 0.001) {
          isAnimating = false;
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("wheel", onMouseWheel);
      canvas.removeEventListener("click", onCanvasClick);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      markerTexture.dispose();
      markerMaterial.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full">
      <canvas className="w-full h-full"  ref={canvasRef} id="canvas" />
    </div>
  );
};

export default PanoramaThree;
