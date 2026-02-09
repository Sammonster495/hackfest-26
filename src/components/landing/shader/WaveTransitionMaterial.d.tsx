import { extend } from "@react-three/fiber";
import type * as THREE from "three";
import { WaveTransitionMaterial } from "./WaveTransitionMaterial";

extend({ WaveTransitionMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      waveTransitionMaterial: React.DetailedHTMLProps<
        React.HTMLAttributes<THREE.ShaderMaterial & { [key: string]: unknown }>,
        THREE.ShaderMaterial & { [key: string]: unknown }
      >;
    }
  }
}
