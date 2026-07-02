import { useGLTF } from "@react-three/drei";

export default function AstronautModel(props) {
  const { scene } = useGLTF("/astronaut.glb");

  return <primitive object={scene} {...props} />;
}

useGLTF.preload("/astronaut.glb");
