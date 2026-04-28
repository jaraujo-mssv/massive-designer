import { useState } from 'react';
import { Post, SidebarTab } from './types';
import { useCampaigns } from './hooks/useCampaigns';
import { LeftSidebar } from './components/LeftSidebar';
import { PostGallery } from './components/PostGallery';
import { RightPanel } from './components/RightPanel';

function App() {
  const { activeCampaign, updatePost, updateTheme } = useCampaigns();
  const [activeTab, setActiveTab] = useState<SidebarTab>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  function handleSelectPost(post: Post) {
    setSelectedPost((prev) => (prev?.id === post.id ? null : post));
  }

  // Keep selectedPost in sync with live campaign state
  const liveSelectedPost = selectedPost
    ? activeCampaign.posts.find((p) => p.id === selectedPost.id) ?? null
    : null;

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        background: '#0f0e18',
      }}
    >
      <LeftSidebar
        campaign={activeCampaign}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPostId={liveSelectedPost?.id ?? null}
        onSelectPost={handleSelectPost}
        onUpdateTheme={updateTheme}
      />

      <PostGallery
        campaign={activeCampaign}
        selectedPostId={liveSelectedPost?.id ?? null}
        onSelectPost={handleSelectPost}
      />

      <RightPanel
        post={liveSelectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdatePost={updatePost}
      />
    </div>
  );
}

export default App;
