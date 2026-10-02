import { createBrowserRouter, Navigate, useLocation } from 'react-router'
import { lazy, Suspense } from 'react'
import { Header } from '@/shared/components/Header'
import { LandingPage } from '@/shared/components/LandingPage'

const CampaignDesignerApp = lazy(() => import('@/tools/campaign-designer/app/App'))
const ContentApp = lazy(() => import('@/tools/content/app/App'))
const DitherApp = lazy(() => import('@/tools/dither/app/App'))
const LogoEncoderApp = lazy(() => import('@/tools/logo-encoder/app/App'))
const MarketMapApp = lazy(() => import('@/tools/market-map/app/App'))
const PartnershipPostApp = lazy(() => import('@/tools/partnership-post/app/App'))
const SocialMediaApp = lazy(() => import('@/tools/social-media/app/App'))
const TopListApp = lazy(() => import('@/tools/top-list/app/App'))
const VideoApp = lazy(() => import('@/tools/video/app/App'))

/** Sends a renamed or merged tool's old links on, keeping their query (?e= …). */
function RedirectTo({ path }: { path: string }) {
  const { search } = useLocation()
  return <Navigate to={`${path}${search}`} replace />
}

function ToolLayout({ children, themeClass }: { children: React.ReactNode; themeClass: string }) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
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
    // Bento Map was merged into Top List; keep old links (and their ?e=) working.
    element: <RedirectTo path="/top-list" />,
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
    path: '/content',
    element: (
      <ToolLayout themeClass="tool-content">
        <ContentApp />
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
    // Image Converter was renamed Logo Encoder.
    element: <RedirectTo path="/logo-encoder" />,
  },
  {
    path: '/logo-encoder',
    element: (
      <ToolLayout themeClass="tool-logo-encoder">
        <LogoEncoderApp />
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
