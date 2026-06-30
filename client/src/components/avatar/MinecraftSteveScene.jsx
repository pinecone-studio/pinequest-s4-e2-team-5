import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useSteveMaterials() {
  return useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({
        color: "#e2a16f",
        roughness: 0.58,
        metalness: 0.02,
      }),
      skinLight: new THREE.MeshStandardMaterial({
        color: "#f0bd89",
        roughness: 0.5,
      }),
      hair: new THREE.MeshStandardMaterial({
        color: "#3b2418",
        roughness: 0.72,
      }),
      shirt: new THREE.MeshStandardMaterial({
        color: "#2ca6ad",
        roughness: 0.48,
        metalness: 0.04,
      }),
      shirtDark: new THREE.MeshStandardMaterial({
        color: "#1b7280",
        roughness: 0.56,
      }),
      pants: new THREE.MeshStandardMaterial({
        color: "#354486",
        roughness: 0.55,
      }),
      shoe: new THREE.MeshStandardMaterial({
        color: "#25252a",
        roughness: 0.68,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: "#17100c",
        roughness: 0.45,
      }),
      eyeShine: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.18,
        emissive: "#ffffff",
        emissiveIntensity: 0.18,
      }),
      mouth: new THREE.MeshStandardMaterial({
        color: "#5b211e",
        roughness: 0.5,
      }),
      grass: new THREE.MeshStandardMaterial({
        color: "#66b347",
        roughness: 0.82,
      }),
      dirt: new THREE.MeshStandardMaterial({
        color: "#8a5b36",
        roughness: 0.88,
      }),
      stone: new THREE.MeshStandardMaterial({
        color: "#7b7f86",
        roughness: 0.75,
      }),
      wood: new THREE.MeshStandardMaterial({
        color: "#8b5a32",
        roughness: 0.78,
      }),
      leaf: new THREE.MeshStandardMaterial({
        color: "#3f9c45",
        roughness: 0.82,
      }),
      diamond: new THREE.MeshStandardMaterial({
        color: "#55e6e1",
        roughness: 0.22,
        metalness: 0.18,
        emissive: "#1bbab6",
        emissiveIntensity: 0.12,
      }),
      // Шинээр нэмэгдсэн материалууд
      flowerRed: new THREE.MeshStandardMaterial({
        color: "#b92e2e",
        roughness: 0.85,
      }),
      flowerYellow: new THREE.MeshStandardMaterial({
        color: "#edd039",
        roughness: 0.85,
      }),
      flowerStem: new THREE.MeshStandardMaterial({
        color: "#4d8a2b",
        roughness: 0.9,
      }),
      fenceWood: new THREE.MeshStandardMaterial({
        color: "#5a3a22",
        roughness: 0.85,
      }),
    }),
    [],
  );
}

function BoxPart({ args, position, material, radius = 0.025, children }) {
  return (
    <RoundedBox
      args={args}
      radius={radius}
      smoothness={2}
      position={position}
      castShadow
      receiveShadow
    >
      <primitive object={material} attach="material" />
      {children}
    </RoundedBox>
  );
}

function FaceTile({ position, scale, material }) {
  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function SteveCharacter({ reducedMotion = false, mood = "speaking" }) {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);
  const leftLegRef = useRef(null);
  const rightLegRef = useRef(null);

  const introFinishedRef = useRef(false);

  const materials = useSteveMaterials();

  useEffect(() => {
    if (!rootRef.current || reducedMotion) {
      introFinishedRef.current = true;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        introFinishedRef.current = true;
      },
    });

    gsap.set(rootRef.current.position, {
      y: -12,
      z: 2,
    });

    gsap.set(rootRef.current.rotation, {
      x: 1.2,
      y: -0.8,
      z: 0.2,
    });

    gsap.set(rootRef.current.scale, {
      x: 0.05,
      y: 0.05,
      z: 0.05,
    });

    tl.to(
      rootRef.current.position,
      {
        y: -1.05,
        z: 0,
        duration: 1.5,
        ease: "power4.out",
      },
      0,
    )
      .to(
        rootRef.current.rotation,
        {
          x: 0,
          y: -0.08,
          z: 0,
          duration: 1.4,
          ease: "power3.out",
        },
        0,
      )
      .to(
        rootRef.current.scale,
        {
          x: 0.88,
          y: 0.88,
          z: 0.88,
          duration: 1.4,
          ease: "back.out(2)",
        },
        0,
      )
      .to(
        rootRef.current.position,
        {
          y: -1.05,
          duration: 0.45,
          ease: "bounce.out",
        },
        "-=0.2",
      );

    return () => {
      tl.kill();
    };
  }, [reducedMotion]);

  useFrame(({ clock, pointer }) => {
    if (!introFinishedRef.current) return;
    if (reducedMotion) return;

    const t = clock.getElapsedTime();

    if (rootRef.current) {
      rootRef.current.position.y +=
        (-1.05 + Math.sin(t * 1.5) * 0.02 - rootRef.current.position.y) * 0.05;

      rootRef.current.rotation.y +=
        (Math.sin(t * 0.4) * 0.03 - rootRef.current.rotation.y) * 0.05;
    }

    if (headRef.current) {
      const targetRotationY = pointer.x * 0.5;
      const targetRotationX = -pointer.y * 0.3;

      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        targetRotationY,
        0.1,
      );

      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        targetRotationX,
        0.1,
      );
    }

    if (rightArmRef.current) {
      if (mood === "listening") {
        rightArmRef.current.rotation.z = -0.15 + Math.sin(t * 1.5) * 0.05;
        rightArmRef.current.rotation.x = Math.sin(t * 1.2) * 0.05;
      } else {
        rightArmRef.current.rotation.z =
          -Math.PI / 2.8 + Math.sin(t * 5.5) * 0.22;
        rightArmRef.current.rotation.x = 0.15 + Math.cos(t * 5.5) * 0.1;
      }
    }

    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = 0.1 + Math.sin(t * 1.5) * 0.04;
      leftArmRef.current.rotation.x = Math.sin(t * 1.2) * 0.05;
    }

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(t * 1.5) * 0.02;
    }

    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -Math.sin(t * 1.5) * 0.02;
    }
  });

  return (
    <group ref={rootRef} position={[0.55, -1.05, 0]} rotation={[0, -0.08, 0]}>
      {/* Толгой */}
      <group ref={headRef} position={[0, 2.85, 0]}>
        <BoxPart
          args={[1.12, 1.12, 1.12]}
          position={[0, 0, 0]}
          material={materials.skin}
          radius={0.035}
        />
        <BoxPart
          args={[1.18, 0.28, 1.18]}
          position={[0, 0.49, 0]}
          material={materials.hair}
          radius={0.025}
        />
        <BoxPart
          args={[1.2, 0.32, 0.22]}
          position={[0, 0.32, 0.55]}
          material={materials.hair}
          radius={0.02}
        />
        <BoxPart
          args={[0.24, 0.42, 0.24]}
          position={[-0.48, 0.22, 0.48]}
          material={materials.hair}
          radius={0.018}
        />
        <BoxPart
          args={[0.2, 0.34, 0.22]}
          position={[0.48, 0.18, 0.48]}
          material={materials.hair}
          radius={0.018}
        />

        <FaceTile
          position={[-0.22, 0.1, 0.568]}
          scale={[0.15, 0.2, 1]}
          material={materials.eye}
        />
        <FaceTile
          position={[0.22, 0.1, 0.568]}
          scale={[0.15, 0.2, 1]}
          material={materials.eye}
        />
        <FaceTile
          position={[-0.25, 0.16, 0.57]}
          scale={[0.045, 0.055, 1]}
          material={materials.eyeShine}
        />
        <FaceTile
          position={[0.19, 0.16, 0.57]}
          scale={[0.045, 0.055, 1]}
          material={materials.eyeShine}
        />
        <FaceTile
          position={[0, -0.11, 0.57]}
          scale={[0.13, 0.08, 1]}
          material={materials.skinLight}
        />
        <FaceTile
          position={[0, -0.27, 0.57]}
          scale={[0.22, 0.07, 1]}
          material={materials.mouth}
        />
      </group>

      {/* Их бие */}
      <BoxPart
        args={[1.08, 1.35, 0.58]}
        position={[0, 1.58, 0]}
        material={materials.shirt}
        radius={0.035}
      />
      <BoxPart
        args={[0.86, 0.16, 0.6]}
        position={[0, 2.17, 0.01]}
        material={materials.shirtDark}
        radius={0.018}
      />
      <BoxPart
        args={[0.52, 0.18, 0.62]}
        position={[-0.28, 0.9, 0.01]}
        material={materials.shirtDark}
        radius={0.016}
      />
      <BoxPart
        args={[0.52, 0.18, 0.62]}
        position={[0.28, 0.9, 0.01]}
        material={materials.shirtDark}
        radius={0.016}
      />

      {/* Зүүн гар */}
      <group ref={leftArmRef} position={[0.73, 2.15, 0]}>
        <BoxPart
          args={[0.38, 0.42, 0.44]}
          position={[0, -0.2, 0]}
          material={materials.skin}
          radius={0.025}
        />
        <BoxPart
          args={[0.38, 0.62, 0.44]}
          position={[0, -0.72, 0]}
          material={materials.shirt}
          radius={0.025}
        />
        <BoxPart
          args={[0.4, 0.34, 0.45]}
          position={[0, -1.22, 0]}
          material={materials.skinLight}
          radius={0.025}
        />
      </group>

      {/* Баруун гар */}
      <group ref={rightArmRef} position={[-0.73, 2.15, 0]}>
        <group position={[0, 0, 0]}>
          <BoxPart
            args={[0.38, 0.42, 0.44]}
            position={[0, -0.2, 0]}
            material={materials.skin}
            radius={0.025}
          />
          <BoxPart
            args={[0.38, 0.62, 0.44]}
            position={[0, -0.72, 0]}
            material={materials.shirt}
            radius={0.025}
          />
          <BoxPart
            args={[0.4, 0.34, 0.45]}
            position={[0, -1.22, 0]}
            material={materials.skinLight}
            radius={0.025}
          />
        </group>
      </group>

      {/* Хөлнүүд */}
      <group ref={leftLegRef} position={[-0.29, 0.9, 0]}>
        <BoxPart
          args={[0.46, 0.9, 0.48]}
          position={[0, -0.38, 0]}
          material={materials.pants}
          radius={0.025}
        />
        <BoxPart
          args={[0.48, 0.24, 0.54]}
          position={[0, -0.95, 0.03]}
          material={materials.shoe}
          radius={0.02}
        />
      </group>
      <group ref={rightLegRef} position={[0.29, 0.9, 0]}>
        <BoxPart
          args={[0.46, 0.9, 0.48]}
          position={[0, -0.38, 0]}
          material={materials.pants}
          radius={0.025}
        />
        <BoxPart
          args={[0.48, 0.24, 0.54]}
          position={[0, -0.95, 0.03]}
          material={materials.shoe}
          radius={0.02}
        />
      </group>
    </group>
  );
}

function GrassBlock({ position, scale = [1, 1, 1], float = false }) {
  const materials = useSteveMaterials();
  const block = (
    <group position={position} scale={scale}>
      <BoxPart
        args={[1, 0.72, 1]}
        position={[0, -0.18, 0]}
        material={materials.dirt}
        radius={0.025}
      />
      <BoxPart
        args={[1.02, 0.22, 1.02]}
        position={[0, 0.3, 0]}
        material={materials.grass}
        radius={0.025}
      />
      <BoxPart
        args={[0.16, 0.18, 1.04]}
        position={[-0.24, 0.08, 0]}
        material={materials.grass}
        radius={0.012}
      />
      <BoxPart
        args={[0.18, 0.18, 1.04]}
        position={[0.28, -0.02, 0]}
        material={materials.grass}
        radius={0.012}
      />
    </group>
  );

  if (!float) return block;
  return (
    <Float speed={1.5} rotationIntensity={0.18} floatIntensity={0.34}>
      {block}
    </Float>
  );
}

function MiniTree({ position }) {
  const materials = useSteveMaterials();
  return (
    <group position={position}>
      <BoxPart
        args={[0.34, 1.2, 0.34]}
        position={[0, -0.35, 0]}
        material={materials.wood}
        radius={0.015}
      />
      <BoxPart
        args={[1.1, 0.8, 1.1]}
        position={[0, 0.58, 0]}
        material={materials.leaf}
        radius={0.03}
      />
      <BoxPart
        args={[0.82, 0.72, 0.82]}
        position={[0.12, 1.08, -0.08]}
        material={materials.leaf}
        radius={0.03}
      />
    </group>
  );
}

function DiamondOre({ position }) {
  const materials = useSteveMaterials();
  return (
    <Float speed={1.25} rotationIntensity={0.4} floatIntensity={0.5}>
      <group position={position} rotation={[0.15, 0.55, 0.1]}>
        <BoxPart
          args={[0.58, 0.58, 0.58]}
          position={[0, 0, 0]}
          material={materials.stone}
          radius={0.025}
        />
        <BoxPart
          args={[0.16, 0.16, 0.62]}
          position={[-0.13, 0.1, 0.03]}
          material={materials.diamond}
          radius={0.01}
        />
        <BoxPart
          args={[0.14, 0.14, 0.62]}
          position={[0.16, -0.12, 0.03]}
          material={materials.diamond}
          radius={0.01}
        />
      </group>
    </Float>
  );
}

function CloudPuff({ position, scale = 1 }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.35,
        transparent: true,
        opacity: 0.82,
      }),
    [],
  );
  return (
    <Float speed={0.55} rotationIntensity={0.06} floatIntensity={0.22}>
      <group position={position} scale={scale}>
        <BoxPart
          args={[1.2, 0.38, 0.4]}
          position={[0, 0, 0]}
          material={material}
          radius={0.12}
        />
        <BoxPart
          args={[0.55, 0.5, 0.42]}
          position={[-0.34, 0.16, 0]}
          material={material}
          radius={0.12}
        />
        <BoxPart
          args={[0.64, 0.55, 0.42]}
          position={[0.22, 0.18, 0]}
          material={material}
          radius={0.12}
        />
      </group>
    </Float>
  );
}

// ШИНЭ: Куб хэлбэрийн Цэцэг (Улаан / Шар)
function Flower({ position, type = "red" }) {
  const materials = useSteveMaterials();
  const petalMaterial =
    type === "red" ? materials.flowerRed : materials.flowerYellow;

  return (
    <group position={position}>
      {/* Иш */}
      <BoxPart
        args={[0.05, 0.3, 0.05]}
        position={[0, 0.15, 0]}
        material={materials.flowerStem}
        radius={0.005}
      />
      {/* Дэлбээ */}
      <BoxPart
        args={[0.15, 0.12, 0.15]}
        position={[0, 0.34, 0]}
        material={petalMaterial}
        radius={0.01}
      />
      <BoxPart
        args={[0.22, 0.06, 0.06]}
        position={[0, 0.32, 0]}
        material={petalMaterial}
        radius={0.005}
      />
    </group>
  );
}

// ШИНЭ: Minecraft деталь өвс
function GrassDetail({ position, scale = [1, 1, 1] }) {
  const materials = useSteveMaterials();
  return (
    <group position={position} scale={scale}>
      <BoxPart
        args={[0.04, 0.28, 0.08]}
        position={[0, 0.14, 0]}
        material={materials.grass}
        radius={0.005}
      />
      <BoxPart
        args={[0.05, 0.18, 0.04]}
        position={[0.03, 0.09, 0.03]}
        material={materials.grass}
        radius={0.005}
      />
    </group>
  );
}

// ШИНЭ: Модон хашаа (Fence)
function WoodFence({ position, rotation = [0, 0, 0] }) {
  const materials = useSteveMaterials();
  return (
    <group position={position} rotation={rotation}>
      {/* Зүүн Багана */}
      <BoxPart
        args={[0.12, 0.85, 0.12]}
        position={[-0.4, 0.425, 0]}
        material={materials.fenceWood}
        radius={0.01}
      />
      {/* Баруун Багана */}
      <BoxPart
        args={[0.12, 0.85, 0.12]}
        position={[0.4, 0.425, 0]}
        material={materials.fenceWood}
        radius={0.01}
      />
      {/* Хөндлөн модод */}
      <BoxPart
        args={[0.76, 0.08, 0.06]}
        position={[0, 0.62, 0]}
        material={materials.fenceWood}
        radius={0.005}
      />
      <BoxPart
        args={[0.76, 0.08, 0.06]}
        position={[0, 0.32, 0]}
        material={materials.fenceWood}
        radius={0.005}
      />
    </group>
  );
}

function MinecraftWorld({ reducedMotion, mood }) {
  const { size } = useThree();
  const narrow = size.width < 720;

  return (
    <>
      <color attach="background" args={["#9bd2ff"]} />

      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#dff5ff", "#7a5230", 1.05]} />
      <directionalLight
        castShadow
        position={[4, 6, 4.5]}
        intensity={2.35}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[-2.8, 2.2, 4]} intensity={0.55} color="#b7fff3" />

      <group
        scale={narrow ? 0.68 : 1}
        position={[narrow ? 0 : 0.05, narrow ? -0.06 : 0, 0]}
      >
        <SteveCharacter reducedMotion={reducedMotion} mood={mood} />
      </group>

      {/* Дэлхийн Блокууд */}
      <GrassBlock
        position={[-3.25, 0.15, -1.25]}
        scale={[0.62, 0.62, 0.62]}
        float={!reducedMotion}
      />

      {/* Хөвж буй зүлгэн блок дээр улаан цэцэг суулгах */}
      <group position={[3.1, 1.1, -1.4]}>
        <GrassBlock
          position={[0, 0, 0]}
          scale={[0.54, 0.54, 0.54]}
          float={!reducedMotion}
        />
        <Flower position={[0, 0.15, 0]} type="red" />
      </group>

      <GrassBlock
        position={[2.9, -0.76, 1.05]}
        scale={[0.5, 0.5, 0.5]}
        float={!reducedMotion}
      />

      <DiamondOre position={[-2.65, -0.85, 1.5]} />
      <MiniTree position={[3.35, -0.95, -0.7]} />
      <CloudPuff position={[-2.55, 2.55, -2.2]} scale={0.78} />
      <CloudPuff position={[2.15, 2.78, -2.8]} scale={0.92} />

      {/* --- Үндсэн зүлгэн дээрх шинэ детал хэсгүүд --- */}
      {/* Модон хашаанууд */}
      <WoodFence position={[-1.8, -1.55, -1]} rotation={[0, 0.4, 0]} />
      <WoodFence position={[1.6, -1.55, 1.3]} rotation={[0, -0.3, 0]} />

      {/* Газар дээрх цэцэгс */}
      <Flower position={[-0.8, -1.55, 1.2]} type="yellow" />
      <Flower position={[1.1, -1.55, 0.7]} type="red" />
      <Flower position={[-2.3, -1.55, 0.4]} type="red" />

      {/* Жижиг деталь өвснүүд */}
      <GrassDetail position={[-0.4, -1.55, 1.5]} scale={[1.2, 1.4, 1.2]} />
      <GrassDetail position={[0.7, -1.55, 1.8]} />
      <GrassDetail position={[-1.4, -1.55, -0.4]} />
      <GrassDetail position={[2.1, -1.55, -0.1]} scale={[1, 1.2, 1]} />

      {/* Үндсэн Дэлхийн Гадаргуу */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.55, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#6DBB45" roughness={1} />
      </mesh>

      {!reducedMotion && (
        <Sparkles
          count={22}
          scale={[4.6, 2.8, 2.4]}
          size={2.5}
          speed={0.22}
          opacity={0.38}
          color="#fff6b0"
          position={[0.15, 1.45, 0.2]}
        />
      )}
    </>
  );
}

export function MinecraftSteveScene({ mood = "speaking" }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="minecraft-steve-stage" aria-hidden="true">
      <Canvas
        className="minecraft-steve-canvas"
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.55, 8.85], fov: 34, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          logarithmicDepthBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <MinecraftWorld reducedMotion={reducedMotion} mood={mood} />
        </Suspense>
      </Canvas>
    </div>
  );
}
