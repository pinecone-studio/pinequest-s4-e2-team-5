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
        color: "#3d7dc4", // teal-ийн оронд цэнхэр
        roughness: 0.75, // гялбааг багасгах
        metalness: 0, // metalness-ийг бүрмөсөн авах
      }),
      shirtDark: new THREE.MeshStandardMaterial({
        color: "#2a5a96",
        roughness: 0.8,
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
      // Жинхэнэ Стив шиг: цагаан цурхайн дэвсгэр + ягаан/цэнхэр хүүхэн хараа
      eyeWhite: new THREE.MeshStandardMaterial({
        color: "#f6f6fb",
        roughness: 0.28,
      }),
      iris: new THREE.MeshStandardMaterial({
        color: "#4b3ea6",
        roughness: 0.4,
      }),
      eyeShine: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.18,
        emissive: "#ffffff",
        emissiveIntensity: 0.18,
      }),
      // Хөмсөг ба сахал — үснээс арай улаавтар бор
      brow: new THREE.MeshStandardMaterial({
        color: "#2e1c11",
        roughness: 0.72,
      }),
      beard: new THREE.MeshStandardMaterial({
        color: "#5a3a24",
        roughness: 0.8,
      }),
      noseShadow: new THREE.MeshStandardMaterial({
        color: "#b9825a",
        roughness: 0.6,
      }),
      mouth: new THREE.MeshStandardMaterial({
        color: "#3f1512",
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
      // Ger — цагаан ноос + хөх хээ + улбар шар хаалга + модон хүрээ
      woolWhite: new THREE.MeshStandardMaterial({
        color: "#f3f3ef",
        roughness: 0.96,
      }),
      woolBlue: new THREE.MeshStandardMaterial({
        color: "#274690",
        roughness: 0.9,
      }),
      gerDoor: new THREE.MeshStandardMaterial({
        color: "#d9772b",
        roughness: 0.7,
      }),
      gerFrame: new THREE.MeshStandardMaterial({
        color: "#7a4a24",
        roughness: 0.8,
      }),
      gerBand: new THREE.MeshStandardMaterial({
        color: "#2b2b2e",
        roughness: 0.85,
      }),
      gerRoof: new THREE.MeshStandardMaterial({
        color: "#9c6b3a",
        roughness: 0.82,
      }),
      // 3D газрын нэмэлт материал
      grassTop: new THREE.MeshStandardMaterial({
        color: "#6dbb45",
        roughness: 1,
      }),
      water: new THREE.MeshStandardMaterial({
        color: "#3a6ea5",
        roughness: 0.22,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
      }),
      sand: new THREE.MeshStandardMaterial({
        color: "#d8c48a",
        roughness: 0.95,
      }),
    }),
    [],
  );
}

function BoxPart({ args, position, rotation = [0, 0, 0], material, radius = 0.025, children }) {
  return (
    <RoundedBox
      args={args}
      radius={radius}
      smoothness={2}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <primitive object={material} attach="material" />
      {children}
    </RoundedBox>
  );
}

function FaceTile({ position, scale, material, innerRef }) {
  return (
    <mesh ref={innerRef} position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function SteveCharacter({
  reducedMotion = false,
  mood = "speaking",
  variant = "full",
}) {
  const compact = variant === "compact";
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);
  const leftLegRef = useRef(null);
  const rightLegRef = useRef(null);
  const mouthRef = useRef(null);

  const introFinishedRef = useRef(false);
  // "celebrate" mood ирэх бүрт хугацааг тэмдэглэж, богино баярын үсрэлт тоглуулна.
  const celebrateStartRef = useRef(0);

  const materials = useSteveMaterials();

  useEffect(() => {
    if (mood === "celebrate") celebrateStartRef.current = performance.now();
  }, [mood]);

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
    const t = clock.getElapsedTime();

    // Ам хөдөлгөөн: AI ярих үед ам нээж хаагаад (lip-sync мэт),
    // баярлах үед том инээмсэглэл, бусад үед нимгэн зурвас.
    if (mouthRef.current) {
      mouthRef.current.scale.y = 0.05;
      mouthRef.current.position.y = -0.235;
    }

    if (!introFinishedRef.current) return;
    if (reducedMotion) return;

    // Баярын үсрэлт: зөв хариулсны дараа ~1.1 сек хоёр удаа бөмбөрч дээш үсэрнэ.
    const sinceCelebrate =
      (performance.now() - celebrateStartRef.current) / 1000;
    const celebrating =
      celebrateStartRef.current > 0 && sinceCelebrate < 1.15 && !reducedMotion;
    const jump = celebrating
      ? Math.abs(Math.sin(sinceCelebrate * Math.PI * 2.2)) *
        0.6 *
        (1 - sinceCelebrate / 1.15)
      : 0;

    if (rootRef.current) {
      const restY = -1.05 + Math.sin(t * 1.5) * 0.02 + jump;
      // Үсрэх үед хурдан (0.35), тайван үед зөөлөн (0.05) лерп.
      rootRef.current.position.y +=
        (restY - rootRef.current.position.y) * (celebrating ? 0.35 : 0.05);

      rootRef.current.rotation.y +=
        (Math.sin(t * 0.4) * 0.03 - rootRef.current.rotation.y) * 0.05;
    }

    if (headRef.current) {
      // learn хуудсанд AI ярих үед толгой өчүүхэн дохиж илүү амьд харагдана.
      const nod = compact && mood === "speaking" ? Math.sin(t * 6) * 0.05 : 0;
      const targetRotationY = pointer.x * 0.5;
      const targetRotationX = -pointer.y * 0.3 + nod;

      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        targetRotationY,
        0.2,
      );

      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        targetRotationX,
        0.2,
      );
    }

    if (compact) {
      // learn хуудасны цээж (bust) харагдац: зүүн гар тайван урд, зөөлөн
      // амьсгалын найгалт. AI ярих үед баруун гар дээш өргөгдөж, хэмнэлтэй
      // "тайлбарлаж яриа" хийж буй мэт дохино.
      const sway = Math.sin(t * 1.6) * 0.06;
      const speaking = mood === "speaking";

      // Зүүн гар — үргэлж тайван урд байрлал
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.72 - sway;
        leftArmRef.current.rotation.z = 0.16;
      }

      // Баруун гар — ярих үед дохих, эс бол тайван урд; огцом биш зөөлөн шилжинэ
      if (rightArmRef.current) {
        const targetX = speaking ? -1.15 + Math.sin(t * 7) * 0.32 : -0.72 + sway;
        const targetZ = speaking ? -0.35 + Math.sin(t * 3.3) * 0.12 : -0.16;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          targetX,
          0.15,
        );
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          targetZ,
          0.15,
        );
      }
    } else {
      if (rightArmRef.current) {
        if (mood === "listening") {
          rightArmRef.current.rotation.z = 0;
          rightArmRef.current.rotation.x = Math.sin(t * 1.5) * 0.08;
        } else {
          // Хурдыг 4.5 болгож ихэсгэн, далайцыг 0.25 болгож илүү тод, огцом урагш хойш хөдөлгөв
          rightArmRef.current.rotation.z = -0.12;
          rightArmRef.current.rotation.x =
            -Math.PI / 4.5 + Math.sin(t * 4.5) * 0.25;
        }
      }
      // Зүүн гар: бага зэрэг найгалзсан тайван байрлал
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = 0.1 + Math.sin(t * 1.5) * 0.04;
        leftArmRef.current.rotation.x = Math.sin(t * 1.2) * 0.05;
      }
    }

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(t * 1.5) * 0.02;
    }

    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -Math.sin(t * 1.5) * 0.02;
    }

    // Баярлаж байх үед хоёр гараа дээш өргөж баяр хөөрөөр даллана.
    if (celebrating) {
      const cheer = -Math.PI / 1.5 + Math.sin(t * 20) * 0.25;
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = cheer;
        rightArmRef.current.rotation.z = -0.22;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = cheer;
        leftArmRef.current.rotation.z = 0.22;
      }
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

// ШИНЭ: Том навчит царс мод (Oak Tree)
function BigOakTree({ position, scale = [1, 1, 1] }) {
  const materials = useSteveMaterials();
  return (
    <group position={position} scale={scale}>
      <BoxPart
        args={[0.45, 2.2, 0.45]}
        position={[0, 1.1, 0]}
        material={materials.wood}
        radius={0.02}
      />
      <BoxPart
        args={[1.8, 1.0, 1.8]}
        position={[0, 2.4, 0]}
        material={materials.leaf}
        radius={0.04}
      />
      <BoxPart
        args={[1.4, 0.8, 1.4]}
        position={[0, 3.1, 0]}
        material={materials.leaf}
        radius={0.04}
      />
      <BoxPart
        args={[0.9, 0.6, 0.9]}
        position={[0, 3.6, 0]}
        material={materials.leaf}
        radius={0.03}
      />
    </group>
  );
}

// ШИНЭ: Өндөр нарс мод (Spruce Tree)
function TallSpruceTree({ position, scale = [1, 1, 1] }) {
  const materials = useSteveMaterials();
  return (
    <group position={position} scale={scale}>
      <BoxPart
        args={[0.35, 3.2, 0.35]}
        position={[0, 1.6, 0]}
        material={materials.wood}
        radius={0.02}
      />
      <BoxPart
        args={[1.6, 0.6, 1.6]}
        position={[0, 1.8, 0]}
        material={materials.leaf}
        radius={0.04}
      />
      <BoxPart
        args={[1.2, 0.6, 1.2]}
        position={[0, 2.4, 0]}
        material={materials.leaf}
        radius={0.03}
      />
      <BoxPart
        args={[0.8, 0.6, 0.8]}
        position={[0, 3.0, 0]}
        material={materials.leaf}
        radius={0.03}
      />
      <BoxPart
        args={[0.4, 0.5, 0.4]}
        position={[0, 3.5, 0]}
        material={materials.leaf}
        radius={0.02}
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

function Flower({ position, type = "red" }) {
  const materials = useSteveMaterials();
  const petalMaterial =
    type === "red" ? materials.flowerRed : materials.flowerYellow;

  return (
    <group position={position}>
      <BoxPart
        args={[0.05, 0.3, 0.05]}
        position={[0, 0.15, 0]}
        material={materials.flowerStem}
        radius={0.005}
      />
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

function WoodFence({ position, rotation = [0, 0, 0] }) {
  const materials = useSteveMaterials();
  return (
    <group position={position} rotation={rotation}>
      <BoxPart
        args={[0.12, 0.85, 0.12]}
        position={[-0.4, 0.425, 0]}
        material={materials.fenceWood}
        radius={0.01}
      />
      <BoxPart
        args={[0.12, 0.85, 0.12]}
        position={[0.4, 0.425, 0]}
        material={materials.fenceWood}
        radius={0.01}
      />
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

function MinecraftWorld({ reducedMotion, mood, variant = "full" }) {
  const { size } = useThree();
  const narrow = size.width < 720;
  const compact = variant === "compact";
  const world = variant === "world";
  const celebrating = mood === "celebrate";

  return (
    <>
      {!compact && <color attach="background" args={["#9bd2ff"]} />}
      {/* Гүн мэдрэгдүүлэх манан — хол блокуудыг бүдгэрүүлж жинхэнэ 3D орчин */}
      {world && <fog attach="fog" args={["#bfe3ff", 13, 42]} />}

      <ambientLight intensity={1.3} />
      <hemisphereLight args={["#dff5ff", "#7a5230", 1.3]} />
      <directionalLight
        castShadow
        position={[4, 6, 4.5]}
        intensity={1.4}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[-2.8, 2.2, 4]} intensity={0.9} color="#ffffff" />

      <group
        scale={
          world
            ? narrow
              ? 1.05
              : 1.32
            : compact
              ? narrow
                ? 0.98
                : 1.12
              : narrow
                ? 0.68
                : 1
        }
        position={
          world
            ? [narrow ? -1.7 : -2.4, 0.22, 1.6]
            : compact
              ? [narrow ? -0.1 : -0.12, -0.28, 0]
              : [narrow ? 0 : 0.05, narrow ? -0.06 : 0, 0]
        }
        // learn хуудсанд Стивийг тал хажуу тийш эргүүлж, зүгээр зогсохгүй
        // илүү амьд, сонирхолтой ¾ өнцгөөр харуулна
        rotation={world || compact ? [0, -0.3, 0] : [0, 0, 0]}
      >
        <SteveCharacter
          reducedMotion={reducedMotion}
          mood={mood}
          variant={variant}
        />
      </group>

      {/* Баяр хүргэх мөчид алтан очлолын дэлбэрэлт */}
      {celebrating && !reducedMotion && (
        <Sparkles
          count={40}
          scale={[4.4, 3.4, 2.2]}
          size={4}
          speed={0.9}
          opacity={0.7}
          color="#ffe45e"
          position={[compact ? -0.4 : 0.15, 1.6, 0.3]}
        />
      )}

      {/* compact хувилбар (learn хуудас): Стив дээр төвлөрүүлэхийн тулд
          эргэн тойрны блок/чимэглэлийг авч, зөвхөн хол дэвсгэрийн бүдэг
          үүл + сул очлолоор гэрэл өгнө */}
      {compact ? (
        <>
          <CloudPuff position={[-3.2, 2.7, -4.2]} scale={0.6} />
          <CloudPuff position={[3.1, 3.0, -4.6]} scale={0.7} />
          {!reducedMotion && (
            <Sparkles
              count={14}
              scale={[4.2, 3.2, 2]}
              size={2}
              speed={0.18}
              opacity={0.26}
              color="#fff6b0"
              position={[-0.35, 1.6, 0.2]}
            />
          )}
        </>
      ) : world ? (
        <>
          {/* Жинхэнэ 3D блокон газар + нуур */}
          <BlockyTerrain />
          {/* Цагаан ноосон Монгол ger */}
          <WoolGer position={[2.7, -1.55, 0.2]} />
          {/* Модод — олон гүнд байрлаж гүн үүсгэнэ */}
          <BigOakTree position={[-5.6, -1.55, -6]} scale={[1.3, 1.4, 1.3]} />
          <TallSpruceTree position={[5.6, -1.55, -7]} scale={[1.2, 1.5, 1.2]} />
          <BigOakTree position={[-3.4, -1.55, -9.5]} scale={[1, 1, 1]} />
          <MiniTree position={[-6.6, -1.55, -2]} />
          <TallSpruceTree position={[7.2, -1.55, -4]} scale={[1, 1.2, 1]} />
          {/* Үүлс */}
          <CloudPuff position={[-4, 3.2, -8]} scale={1} />
          <CloudPuff position={[3.5, 3.7, -9.5]} scale={1.2} />
          <CloudPuff position={[0, 4, -11]} scale={1.1} />
          {/* Цэцэг + өвс */}
          <Flower position={[-3.2, -1.55, 1.6]} type="red" />
          <Flower position={[-1.4, -1.55, 2.1]} type="yellow" />
          <GrassDetail position={[-4.2, -1.55, 0.6]} />
          <GrassDetail position={[0.6, -1.55, 1.9]} />
          {!reducedMotion && (
            <Sparkles
              count={18}
              scale={[9, 3, 5]}
              size={2}
              speed={0.2}
              opacity={0.28}
              color="#fff6b0"
              position={[0, 1.6, -2]}
            />
          )}
        </>
      ) : (
        <FullMinecraftWorld reducedMotion={reducedMotion} />
      )}
    </>
  );
}

function FullMinecraftWorld({ reducedMotion }) {
  return (
    <>
      {/* Дэлхийн Блокууд */}
      <GrassBlock
        position={[-3.25, 0.15, -1.25]}
        scale={[0.62, 0.62, 0.62]}
        float={!reducedMotion}
      />

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
      <CloudPuff position={[-2.55, 2.55, -2.2]} scale={0.78} />
      <CloudPuff position={[2.15, 2.78, -2.8]} scale={0.92} />

      {/* --- МОДНУУД --- */}
      <MiniTree position={[3.35, -1.55, -0.7]} />
      <BigOakTree position={[-3.8, -1.55, -2.5]} scale={[1.2, 1.2, 1.2]} />
      <TallSpruceTree position={[3.6, -1.55, -3.0]} scale={[1.1, 1.3, 1.1]} />
      <BigOakTree position={[-1.2, -1.55, -3.5]} scale={[0.8, 0.8, 0.8]} />

      {/* --- ДЕТАЛ ХЭСГҮҮД --- */}
      <WoodFence position={[-1.8, -1.55, -1]} rotation={[0, 0.4, 0]} />
      <WoodFence position={[1.6, -1.55, 1.3]} rotation={[0, -0.3, 0]} />

      <Flower position={[-0.8, -1.55, 1.2]} type="yellow" />
      <Flower position={[1.1, -1.55, 0.7]} type="red" />
      <Flower position={[-2.3, -1.55, 0.4]} type="red" />

      <GrassDetail position={[-0.4, -1.55, 1.5]} scale={[1.2, 1.4, 1.2]} />
      <GrassDetail position={[0.7, -1.55, 1.8]} />
      <GrassDetail position={[-1.4, -1.55, -0.4]} />
      <GrassDetail position={[2.1, -1.55, -0.1]} scale={[1, 1.2, 1]} />

      {/* Үндсэн Гадаргуу */}
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

/* ── Жижиг грасс блок (хурц Minecraft куб) ── */
function GrassCell({ position, top = "#6dbb45", side = "#7a4d2b" }) {
  return (
    <group position={position}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={side} roughness={1} />
      </mesh>
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[1.02, 0.16, 1.02]} />
        <meshStandardMaterial color={top} roughness={1} />
      </mesh>
    </group>
  );
}

/* ── Жинхэнэ 3D блокон газар: ойрын блок тор + толгод + хол тэгш + нуур ── */
function BlockyTerrain() {
  const m = useSteveMaterials();
  const surfaceY = -1.55;
  const inWater = (x, z) => x >= 3 && x <= 5 && z <= -2 && z >= -4;
  const inGerFootprint = (x, z) => x >= 1 && x <= 4 && z >= -2 && z <= 2;
  const cells = useMemo(() => {
    const out = [];
    for (let x = -6; x <= 6; x++) {
      // Зөвхөн ард талын (z <= 1) толгодыг (rise > 0) л зурна. Урд/хавтгай
      // хэсгийг хол ногоон плантай орхиж, зэрэгцээ гадаргуунуудын z-fight
      // (хазайсан зурас) ба урд эгнээний хүрэн ирмэгийг хоёуланг нь арилгана.
      for (let z = 1; z >= -4; z--) {
        if (inWater(x, z)) continue;
        if (inGerFootprint(x, z)) continue;
        const rise = Math.max(
          0,
          Math.round(Math.sin(x * 0.7) * 0.6 + Math.cos(z * 0.6) * 0.6),
        );
        if (rise <= 0) continue;
        out.push({ x, z, rise });
      }
    }
    return out;
  }, []);

  return (
    <>
      {/* Хол хүртэлх тэгш талбай (манан руу уусна) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, surfaceY - 0.02, -13]} receiveShadow>
        <planeGeometry args={[140, 100]} />
        <primitive object={m.grassTop} attach="material" />
      </mesh>

      {/* Ойрын блокон гадаргуу (толгодтой) */}
      {cells.map(({ x, z, rise }, i) => (
        <GrassCell key={i} position={[x, surfaceY - 0.5 + rise, z]} />
      ))}

      {/* Нуур: усны хавтгай + элсэн эрэг */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, surfaceY - 0.3, -3]}>
        <planeGeometry args={[3.4, 3.4]} />
        <primitive object={m.water} attach="material" />
      </mesh>
      {[[2, -2], [2, -4], [5.6, -3], [4, -4.6]].map(([x, z], i) => (
        <mesh key={`s${i}`} position={[x, surfaceY - 0.55, z]} receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={m.sand} attach="material" />
        </mesh>
      ))}
    </>
  );
}

/* ── Цагаан ноосон блокоор барьсан Монгол ger (Minecraft хэв маяг) ── */
function WoolGer({ position = [0, 0, 0], scale = 1 }) {
  const m = useSteveMaterials();
  const sides = 16;
  const radius = 1.6;
  const wallTierH = 0.85;

  const ring = (r, n = sides, offset = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + offset;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, a };
    });

  const wallPositions = useMemo(() => ring(radius), []);
  const roofTiers = useMemo(() => {
    const tiers = [
      { r: 1.5, w: 0.76, th: 0.3, y: 1.75 },
      { r: 1.11, w: 0.56, th: 0.28, y: 1.93 },
      { r: 0.821, w: 0.42, th: 0.26, y: 2.09 },
      { r: 0.608, w: 0.31, th: 0.24, y: 2.24 },
      { r: 0.45, w: 0.23, th: 0.22, y: 2.38 },
    ];
    return tiers.map((t, lvl) => ({ ...t, cells: ring(t.r, sides, lvl * 0.1) }));
  }, []);

  return (
    <group position={position} scale={scale}>
      {wallPositions.map(({ x, z, a }, i) => (
        <group key={i}>
          <BoxPart args={[0.22, wallTierH, 0.8]} position={[x, wallTierH / 2, z]} rotation={[0, -a, 0]} material={m.woolWhite} radius={0.02} />
          <BoxPart args={[0.22, wallTierH, 0.8]} position={[x, wallTierH * 1.5, z]} rotation={[0, -a, 0]} material={m.woolWhite} radius={0.02} />
          <BoxPart args={[0.24, 0.16, 0.86]} position={[x, wallTierH, z]} rotation={[0, -a, 0]} material={m.gerBand} radius={0.015} />
        </group>
      ))}
      {roofTiers.map((tier, lvl) =>
        tier.cells.map(({ x, z, a }, i) => (
          <BoxPart
            key={`${lvl}-${i}`}
            args={[0.4, tier.th, tier.w]}
            position={[x, tier.y, z]}
            rotation={[0, -a, 0]}
            material={m.gerRoof}
            radius={0.02}
          />
        )),
      )}
      {/* Тооно (орой) */}
      <BoxPart args={[0.7, 0.26, 0.7]} position={[0, 2.62, 0]} material={m.gerFrame} radius={0.02} />
      {/* Хаалга — урд тал (+z) */}
      <group position={[0, 0, radius + 0.05]}>
        <BoxPart args={[0.78, 1.4, 0.16]} position={[0, 0.7, 0]} material={m.gerDoor} radius={0.02} />
        <BoxPart args={[0.95, 0.16, 0.14]} position={[0, 1.45, 0]} material={m.gerBand} radius={0.01} />
        <BoxPart args={[0.16, 1.5, 0.14]} position={[-0.45, 0.75, 0]} material={m.gerBand} radius={0.01} />
        <BoxPart args={[0.16, 1.5, 0.14]} position={[0.45, 0.75, 0]} material={m.gerBand} radius={0.01} />
      </group>
    </group>
  );
}

export function MinecraftSteveScene({ mood = "speaking", variant = "full" }) {
  const reducedMotion = usePrefersReducedMotion();
  const compact = variant === "compact";
  const world = variant === "world";

  return (
    <div
      className={`minecraft-steve-stage${compact ? " minecraft-steve-stage--compact" : ""}${world ? " minecraft-steve-stage--world" : ""}`}
      aria-hidden="true"
    >
      <Canvas
        className="minecraft-steve-canvas"
        shadows
        dpr={[1, 2]}
        camera={
          world
            ? { position: [0, 2.4, 12], fov: 46, near: 0.1, far: 60 }
            : compact
              ? { position: [0, 1.0, 8.5], fov: 33, near: 0.1, far: 40 }
              : { position: [0, 1.55, 8.85], fov: 34, near: 0.1, far: 40 }
        }
        gl={{
          antialias: true,
          // Үргэлж alpha:true — R3F renderer-ийг зөвхөн mount үед үүсгэдэг тул
          // world→compact шилжихэд хар дэвсгэр гарахаас сэргийлнэ. World горимд
          // <color> тэнгэрийг зурдаг тул ил тод байсан ч асуудалгүй.
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          logarithmicDepthBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <MinecraftWorld
            reducedMotion={reducedMotion}
            mood={mood}
            variant={variant}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
