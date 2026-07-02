import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

export const ROBOT_SCENE_URL =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

export function SplineScene({ scene = ROBOT_SCENE_URL, className = "" }) {
  return (
    <Suspense
      fallback={
        <div
          className="spline-loading"
          role="status"
          aria-label="3D робот ачаалж байна"
        >
          <span className="spline-loader" />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
