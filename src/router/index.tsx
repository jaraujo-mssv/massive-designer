import { createBrowserRouter } from 'react-router'
import { lazy, Suspense } from 'react'
import { Header } from '@/shared/components/Header'
import { LandingPage } from '@/shared/components/LandingPage'

const BentoMapApp = lazy(() => import('@/tools/bento-map/app/App'))
const CampaignDesignerApp = lazy(() => import('@/tools/campaign-designer/app/App'))
const DitherApp = lazy(() => import('@/tools/dither/app/App'))
const ImageUploadApp = lazy(() => import('@/tools/image-upload/app/App'))
const MarketMapApp = lazy(() => import('@/tools/market-map/app/App'))
const PartnershipPostApp = lazy(() => import('@/tools/partnership-post/app/App'))
const SocialMediaApp = lazy(() => import('@/tools/social-media/app/App'))
const TopListApp = lazy(() => import('@/tools/top-list/app/App'))
const VideoApp = lazy(() => import('@/tools/video/app/App'))

function ToolLayout({ children, themeClass }: { children: React.ReactNode; themeClass: string }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className={`${themeClass} flex-1 min-h-0`}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full bg-white text-slate-500 text-sm">
              Loading...
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
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
    path: '/bento-map',
    element: (
      <ToolLayout themeClass="tool-bento-map">
        <BentoMapApp />
      </ToolLayout>
    ),
  },
  {
    path: '/campaign-designer',
    element: (
      <ToolLayout themeClass="tool-campaign-designer">
        <CampaignDesignerApp />
      </ToolLayout>
    ),
  },
  {
    path: '/dither',
    element: (
      <ToolLayout themeClass="tool-dither">
        <DitherApp />
      </ToolLayout>
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
    path: '/partnership-post',
    element: (
      <ToolLayout themeClass="tool-partnership-post">
        <PartnershipPostApp />
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
  {
    path: '/video',
    element: (
      <ToolLayout themeClass="tool-video">
        <VideoApp />
      </ToolLayout>
    ),
  },
])
