import { useState } from 'react';
import { Campaign, CampaignTheme, PostContent } from '../types';
import { INITIAL_CAMPAIGNS } from '../constants';

export function useCampaigns() {
  const [campaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [activeCampaignId, setActiveCampaignId] = useState<string>(INITIAL_CAMPAIGNS[0].id);
  const [campaignStates, setCampaignStates] = useState<Record<string, Campaign>>(
    Object.fromEntries(INITIAL_CAMPAIGNS.map((c) => [c.id, c]))
  );

  const activeCampaign = campaignStates[activeCampaignId];

  function updatePost(postId: string, content: Partial<PostContent>) {
    setCampaignStates((prev) => {
      const campaign = prev[activeCampaignId];
      return {
        ...prev,
        [activeCampaignId]: {
          ...campaign,
          posts: campaign.posts.map((p) =>
            p.id === postId ? { ...p, content: { ...p.content, ...content } } : p
          ),
        },
      };
    });
  }

  function updateTheme(theme: Partial<CampaignTheme>) {
    setCampaignStates((prev) => {
      const campaign = prev[activeCampaignId];
      return {
        ...prev,
        [activeCampaignId]: {
          ...campaign,
          theme: { ...campaign.theme, ...theme },
        },
      };
    });
  }

  return {
    campaigns,
    activeCampaign,
    setActiveCampaignId,
    updatePost,
    updateTheme,
  };
}
