import { createBrowserRouter } from 'react-router'
import { lazy, Suspense } from 'react'
import { Header } from '@/shared/components/Header'
import { LandingPage } from '@/shared/components/LandingPage'

const ImageUploadApp = lazy(() => import('@/tools/image-upload/app/App'))
const MarketMapApp = lazy(() => import('@/tools/market-map/app/App'))
const SocialMediaApp = lazy(() => import('@/tools/social-media/app/App'))
const TopListApp = lazy(() => import('@/tools/top-list/app/App'))

function ToolLayout({ children, themeClass }: { children: React.ReactNode; themeClass: string }) {
  return (
    <>
      <Header />
      <div className={themeClass}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen bg-white text-slate-500 text-sm">
              Loading...
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <Header />
        <LandingPage />
      </>
    ),
  },
  {
    path: '/image-upload',
    element: (
      <ToolLayout themeClass="tool-image-upload">
        <ImageUploadApp />
      </ToolLayout>
    ),
  },
  {
    path: '/market-map',
    element: (
      <ToolLayout themeClass="tool-market-map">
        <MarketMapApp />
      </ToolLayout>
    ),
  },
  {
    path: '/social-media',
    element: (
      <ToolLayout themeClass="tool-social-media">
        <SocialMediaApp />
      </ToolLayout>
    ),
  },
  {
    path: '/top-list',
    element: (
      <ToolLayout themeClass="tool-top-list">
        <TopListApp />
      </ToolLayout>
    ),
  },
])
