import { createBrowserRouter, Navigate, useLocation } from 'react-router'
import { lazy, Suspense } from 'react'
import { Header } from '@/shared/components/Header'
import { LandingPage } from '@/shared/components/LandingPage'
import { VersionedTool } from '@/shared/canvas/ToolVersion'

const CampaignDesignerApp = lazy(() => import('@/tools/campaign-designer/app/App'))
const DitherApp = lazy(() => import('@/tools/dither/app/App'))
const ImagesApp = lazy(() => import('@/tools/images/app/App'))
const LogoEncoderApp = lazy(() => import('@/tools/logo-encoder/app/App'))
const MarketMapApp = lazy(() => import('@/tools/market-map/app/App'))
// Pre-revamp versions, behind each tool's New | Legacy switch (same URL).
const MarketMapLegacyApp = lazy(() => import('@/tools/market-map-legacy/app/App'))
const MerchApp = lazy(() => import('@/tools/merch/app/App'))
const PartnershipPostApp = lazy(() => import('@/tools/partnership-post/app/App'))
const SocialMediaApp = lazy(() => import('@/tools/social-media/app/App'))
const TopListApp = lazy(() => import('@/tools/top-list/app/App'))
const TopListLegacyApp = lazy(() => import('@/tools/top-list-legacy/app/App'))
// Not in the nav: /trash is only reachable by URL.
const TrashApp = lazy(() => import('@/tools/trash/app/App'))

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

/**
 * Video and Content work on local files (video projects and renders, the campaign docs under content/), so only the
 * dev server has them. In a build `import.meta.env.DEV` is false, this goes unused and Rollup drops it with its
 * imports: no chunks, none of content/'s markdown, and the vite.config build step drops their public/ folders.
 * (/trash is the exception: it's live, with only trash.md and the photos it lists.)
 */
function localOnlyRoutes() {
  const ContentApp = lazy(() => import('@/tools/content/app/App'))
  const VideoApp = lazy(() => import('@/tools/video/app/App'))
  return [
    {
      path: '/content',
      element: (
        <ToolLayout themeClass="tool-content">
          <ContentApp />
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
  ]
}

/** On the deployed site, old links to the local-only tools land on the home page. */
const localOnlyRedirects = ['/content', '/video'].map((path) => ({
  path,
  element: <Navigate to="/" replace />,
}))

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
        {/* Opens in New, or in the version last picked in this browser. ?f= (locked
            embed) is a legacy-only link, so it opens in Legacy whatever was picked. */}
        <VersionedTool
          newApp={MarketMapApp}
          legacyApp={MarketMapLegacyApp}
          legacyWhen={(q) => q.has('f')}
          storageKey="market-map.version"
        />
      </ToolLayout>
    ),
  },
  {
    path: '/merch',
    element: (
      <ToolLayout themeClass="tool-merch">
        <MerchApp />
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
        {/* Opens in New, or in the version last picked in this browser. */}
        <VersionedTool newApp={TopListApp} legacyApp={TopListLegacyApp} storageKey="top-list.version" />
      </ToolLayout>
    ),
  },
  {
    path: '/images',
    element: (
      <ToolLayout themeClass="tool-images">
        <ImagesApp />
      </ToolLayout>
    ),
  },
  {
    path: '/trash',
    element: (
      <ToolLayout themeClass="tool-trash">
        <TrashApp />
      </ToolLayout>
    ),
  },
  ...(import.meta.env.DEV ? localOnlyRoutes() : localOnlyRedirects),
])
