import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars, useGLTF } from "@react-three/drei";

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

function AstronautModel(props) {
  const { scene } = useGLTF("/astronaut.glb");
  return <primitive object={scene} {...props} />;
}

useGLTF.preload("/astronaut.glb");

/* Хийсвэр орчинд жин алдсан мэт удаан эргэлдэж, дрейф хийнэ */
function DriftingAstronaut({ compact, reducedMotion }) {
  const tumbleRef = useRef(null);

  useFrame(({ clock }) => {
    if (reducedMotion || !tumbleRef.current) return;
    const t = clock.getElapsedTime();
    tumbleRef.current.rotation.y = t * 0.22;
    tumbleRef.current.rotation.x = Math.sin(t * 0.35) * 0.18;
    tumbleRef.current.rotation.z = Math.sin(t * 0.27 + 1.3) * 0.12;
  });

  const scale = compact ? 1.35 : 1.95;

  const model = (
    <group ref={tumbleRef} scale={scale}>
      <AstronautModel />
    </group>
  );

  if (reducedMotion) return model;

  return (
    <Float
      speed={1.1}
      rotationIntensity={0}
      floatIntensity={compact ? 1.1 : 1.6}
      floatingRange={[-0.35, 0.35]}
    >
      {model}
    </Float>
  );
}

function AstronautWorld({ variant, reducedMotion }) {
  const compact = variant === "compact";

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={1.15} color="#dfe8ff" />
      <pointLight position={[-3, -2, -3]} intensity={0.6} color="#6a8dff" />
      <pointLight position={[2, 1, 4]} intensity={0.4} color="#ffd9a0" />

      <Stars
        radius={70}
        depth={45}
        count={compact ? 900 : 3200}
        factor={compact ? 2.4 : 3.4}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.5}
      />

      {!reducedMotion && (
        <Sparkles
          count={compact ? 16 : 30}
          scale={compact ? [3, 3, 3] : [5, 5, 5]}
          size={2.2}
          speed={0.25}
          opacity={0.45}
          color="#bcd2ff"
        />
      )}

      <DriftingAstronaut compact={compact} reducedMotion={reducedMotion} />
    </>
  );
}

export function AstronautScene({ variant = "world" }) {
  const reducedMotion = usePrefersReducedMotion();
  const compact = variant === "compact";

  return (
    <div
      className={`astronaut-3d-stage${compact ? " astronaut-3d-stage--compact" : ""}`}
      aria-hidden="true"
    >
      <Canvas
        className="astronaut-3d-canvas"
        dpr={[1, 2]}
        camera={
          compact
            ? { position: [0, 0, 4.4], fov: 32, near: 0.1, far: 60 }
            : { position: [0, 0, 5.6], fov: 36, near: 0.1, far: 60 }
        }
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <AstronautWorld variant={variant} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
