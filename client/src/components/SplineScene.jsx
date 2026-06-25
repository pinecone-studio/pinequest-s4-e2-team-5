import { Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

export function SplineScene({ scene, className = '' }) {
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
