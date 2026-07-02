import { Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

export const BARBIE_SCENE_URL = 'https://prod.spline.design/EDTSfwQQP2KKuBn4/scene.splinecode'


export function SplineSceneBarbie({ scene = BARBIE_SCENE_URL, className = '' }) {
  if (!scene) return null

  return (
    <Suspense
      fallback={
        <div className="spline-loading" role="status" aria-label="3D дүр ачаалж байна">
          <span className="spline-loader" />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
