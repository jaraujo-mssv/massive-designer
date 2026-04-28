import { Campaign } from '../types';
import { DEFAULT_DARK_THEME } from './theme';

const G = (n: number) => `/web-render-api/Gradient ${String(n).padStart(2, '0')}.jpg`;

export const WEB_RENDER_LAUNCH_CAMPAIGN: Campaign = {
  id: 'web-render-api-launch',
  name: 'Web Render API Launch',
  createdAt: 1746403200000,
  theme: DEFAULT_DARK_THEME,
  posts: [
    // ─── Pre-Launch Assets ─────────────────────────────────────────
    {
      id: '28-apr-blog-launch-banner',
      name: '28 Apr - Blog Launch Banner',
      templateType: 'blog-announcement',
      content: {
        title: 'Massive Web Render: Live LLMs, Real Search, Any Website',
        author: 'Jason Grad',
        authorRole: 'CEO, Massive',
        imageUrl: G(7),
      },
    },
    {
      id: '28-apr-product-hunt-gallery',
      name: '28 Apr - Product Hunt Gallery',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Product Hunt',
        title: 'Web Render API — Three Endpoints, One API',
        imageUrl: G(8),
      },
    },

    // ─── Launch Week (May 4–8) ─────────────────────────────────────
    {
      id: '04-may-tease-post',
      name: '04 May - Tease Post',
      templateType: 'hero-image',
      content: {
        heroTitle: 'Tomorrow we ship the thing we\'ve been building for 18 months.',
        heroImageUrl: G(9),
      },
    },
    {
      id: '05-may-launch-linkedin-jason',
      name: '05 May - Launch LinkedIn Jason',
      templateType: 'hero-image',
      content: {
        heroTitle: 'Massive Web Render is live.',
        heroImageUrl: G(10),
      },
    },
    {
      id: '05-may-launch-linkedin-company',
      name: '05 May - Launch LinkedIn Company',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Now Live',
        title: 'Web Render API — Three Endpoints, One API',
        imageUrl: G(11),
      },
    },
    {
      id: '05-may-launch-x-thread',
      name: '05 May - Launch X Thread',
      templateType: 'terminal',
      content: {
        codeTitle: 'Query any LLM in one line',
        terminalTitle: 'web-render-api',
        codeSnippet: `curl -X POST https://api.joinmassive.com/ai \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`,
      },
    },
    {
      id: '05-may-blog-post-banner',
      name: '05 May - Blog Post Banner',
      templateType: 'blog-announcement',
      content: {
        title: 'Massive Web Render: Live LLMs, Real Search, Any Website',
        author: 'Jason Grad',
        authorRole: 'CEO, Massive',
        imageUrl: G(12),
      },
    },
    {
      id: '05-may-midday-progress-update',
      name: '05 May - Midday Progress Update',
      templateType: 'quote',
      content: {
        quoteText: 'We hit 200 signups in the first 3 hours. Thank you.',
        quoteAuthor: 'Jason Grad',
        quoteRole: 'CEO, Massive',
      },
    },
    {
      id: '06-may-recap-post',
      name: '06 May - Recap Post',
      templateType: 'quote',
      content: {
        quoteText: 'Yesterday was wild. Here\'s what happened.',
        quoteAuthor: 'Jason Grad',
        quoteRole: 'CEO, Massive',
      },
    },
    {
      id: '06-may-ai-deep-dive-blog-banner',
      name: '06 May - /ai Deep Dive Blog Banner',
      templateType: 'blog-announcement',
      content: {
        title: 'How We Built Live LLM Completions at Scale',
        author: 'Vova',
        authorRole: 'Head of Engineering, Massive',
        imageUrl: G(13),
      },
    },
    {
      id: '06-may-x-demo-ai-use-cases',
      name: '06 May - X Demo /ai Use Cases',
      templateType: 'terminal',
      content: {
        codeTitle: 'Brand monitoring with /ai',
        terminalTitle: 'web-render-api',
        codeSnippet: `curl -X POST https://api.joinmassive.com/ai \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "geo": "US",
    "messages": [{"role": "user",
      "content": "How does ChatGPT describe Massive?"}]
  }'`,
      },
    },
    {
      id: '07-may-browser-deep-dive-blog-banner',
      name: '07 May - /browser Deep Dive Blog Banner',
      templateType: 'blog-announcement',
      content: {
        title: 'Rendering the Web Through Consent',
        author: 'Jason Grad',
        authorRole: 'CEO, Massive',
        imageUrl: G(14),
      },
    },
    {
      id: '07-may-customer-use-case-linkedin',
      name: '07 May - Customer Use Case LinkedIn',
      templateType: 'quote',
      content: {
        quoteText: 'Massive Web Render cut our data pipeline build time by 80%.',
        quoteAuthor: 'Customer',
        quoteRole: 'AI Company',
      },
    },
    {
      id: '08-may-search-deep-dive-blog-banner',
      name: '08 May - /search Deep Dive Blog Banner',
      templateType: 'blog-announcement',
      content: {
        title: 'Extracting Google AI Overviews at Scale',
        author: 'Jason Grad',
        authorRole: 'CEO, Massive',
        imageUrl: G(15),
      },
    },
    {
      id: '08-may-tease-drip-phase',
      name: '08 May - Tease Drip Phase',
      templateType: 'hero-image',
      content: {
        heroTitle: '3 streams of content starting Monday.',
        heroImageUrl: G(7),
      },
    },
    {
      id: '08-may-week-1-recap',
      name: '08 May - Week 1 Recap',
      templateType: 'quote',
      content: {
        quoteText: 'Launch week by the numbers. Here\'s what we learned.',
        quoteAuthor: 'Jason Grad',
        quoteRole: 'CEO, Massive',
      },
    },

    // ─── Drip Week 1 (May 11–15) ───────────────────────────────────
    {
      id: '11-may-amazon-scraper',
      name: '11 May - Amazon Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Amazon product data in one call',
        terminalTitle: 'amazon-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "format": "json"
  }'`,
      },
    },
    {
      id: '12-may-geotargeting-demo',
      name: '12 May - Geotargeting Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'Geotargeting Across 195 Countries',
        imageUrl: G(8),
      },
    },
    {
      id: '13-may-google-maps-scraper',
      name: '13 May - Google Maps Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Google Maps listings',
        terminalTitle: 'google-maps-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://maps.google.com/search/coffee+shops",
    "format": "json",
    "geo": "US-CA"
  }'`,
      },
    },
    {
      id: '14-may-claude-unblocker',
      name: '14 May - Claude Unblocker',
      templateType: 'logo-pair',
      content: {
        companyName: 'Anthropic',
        companyLogoUrl: '/web-render-api/Claude.svg',
        imageUrl: G(10),
      },
    },
    {
      id: '15-may-google-serp-scraper',
      name: '15 May - Google SERP Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Get real Google search results',
        terminalTitle: 'google-serp-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/search \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "q": "best residential proxy 2025",
    "engine": "google",
    "awaiting": "ai",
    "geo": "US"
  }'`,
      },
    },

    // ─── Drip Week 2 (May 18–22) ───────────────────────────────────
    {
      id: '18-may-linkedin-scraper',
      name: '18 May - LinkedIn Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Enrich LinkedIn profiles at scale',
        terminalTitle: 'linkedin-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.linkedin.com/in/jasongrad",
    "format": "json"
  }'`,
      },
    },
    {
      id: '19-may-chatgpt-geo-comparison',
      name: '19 May - ChatGPT Geo Comparison Demo',
      templateType: 'geo-comparison',
      content: {
        geoPrompt: 'best CRM for a small startup',
        geoItems: [
          {
            flag: '🇺🇸',
            country: 'United States',
            code: 'US',
            picks: [
              { name: 'HubSpot CRM' },
              { name: 'Zoho CRM', onlyHere: true },
              { name: 'Pipedrive' },
              { name: 'Attio' },
              { name: 'Folk', onlyHere: true },
            ],
            snippet: "The wrong CRM becomes expensive shelfware. Pick based on ease of use, price, and how fast your team will adopt it.",
          },
          {
            flag: '🇧🇷',
            country: 'Brazil',
            code: 'BR',
            picks: [
              { name: 'Startup Tip', onlyHere: true },
              { name: 'HubSpot Free', onlyHere: true },
              { name: 'Zoho CRM Free', onlyHere: true },
              { name: 'Attio' },
              { name: 'Pipedrive' },
            ],
            snippet: "For a small startup, the best CRM depends on your priorities: simplicity, cost, scalability, and integrations.",
          },
          {
            flag: '🇯🇵',
            country: 'Japan',
            code: 'JP',
            picks: [
              { name: 'HubSpot CRM' },
              { name: 'Pipedrive' },
              { name: 'Bigin', onlyHere: true },
              { name: 'Attio' },
              { name: 'Close', onlyHere: true },
            ],
            snippet: "It's not about the most powerful tool — it's about ease of use, low cost, and room to grow.",
          },
        ],
      },
    },
    {
      id: '20-may-reddit-scraper',
      name: '20 May - Reddit Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Monitor any subreddit',
        terminalTitle: 'reddit-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.reddit.com/r/MachineLearning/new.json",
    "format": "json"
  }'`,
      },
    },
    {
      id: '21-may-agentic-cloud-manifesto-blog-banner',
      name: '21 May - Agentic Cloud Manifesto Blog Banner',
      templateType: 'blog-announcement',
      content: {
        title: 'The Agentic Cloud Manifesto',
        author: 'Jason Grad',
        authorRole: 'CEO, Massive',
        imageUrl: G(9),
      },
    },
    {
      id: '22-may-youtube-scraper',
      name: '22 May - YouTube Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Pull YouTube channel data',
        terminalTitle: 'youtube-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.youtube.com/@anthropic/videos",
    "format": "json"
  }'`,
      },
    },

    // ─── Drip Week 3 (May 26–29) ───────────────────────────────────
    {
      id: '26-may-google-ai-overviews-demo',
      name: '26 May - Google AI Overviews Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'Extracting Google AI Overviews + People Also Ask',
        imageUrl: G(10),
      },
    },
    {
      id: '27-may-instagram-scraper',
      name: '27 May - Instagram Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Instagram profiles',
        terminalTitle: 'instagram-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.instagram.com/joinmassive/",
    "format": "json"
  }'`,
      },
    },
    {
      id: '28-may-codex-unblocker',
      name: '28 May - Codex Unblocker',
      templateType: 'logo-pair',
      content: {
        companyName: 'OpenAI',
        companyLogoUrl: '/web-render-api/OpenAI.svg',
        imageUrl: G(12),
      },
    },
    {
      id: '29-may-x-twitter-scraper',
      name: '29 May - X/Twitter Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Pull X/Twitter data at scale',
        terminalTitle: 'x-twitter-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://x.com/joinmassive",
    "format": "json"
  }'`,
      },
    },

    // ─── Drip Week 4 (Jun 1–5) ─────────────────────────────────────
    {
      id: '01-jun-tiktok-scraper',
      name: '01 Jun - TikTok Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape TikTok profile + video data',
        terminalTitle: 'tiktok-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.tiktok.com/@openai",
    "format": "json"
  }'`,
      },
    },
    {
      id: '02-jun-sticky-sessions-demo',
      name: '02 Jun - Sticky Sessions Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'Sticky Sessions: Maintain State for 12 Minutes',
        imageUrl: G(11),
      },
    },
    {
      id: '03-jun-github-scraper',
      name: '03 Jun - GitHub Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Pull GitHub repo + user data',
        terminalTitle: 'github-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://github.com/anthropics/anthropic-sdk-python",
    "format": "json"
  }'`,
      },
    },
    {
      id: '04-jun-case-study-blog-banner',
      name: '04 Jun - Case Study Blog Banner',
      templateType: 'blog-announcement',
      content: {
        title: 'How an AI Company Uses Massive for Agent Grounding',
        author: 'Jason Grad',
        authorRole: 'CEO, Massive',
        imageUrl: G(12),
      },
    },
    {
      id: '05-jun-walmart-scraper',
      name: '05 Jun - Walmart Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Walmart product data',
        terminalTitle: 'walmart-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.walmart.com/search?q=coffee+maker",
    "format": "json"
  }'`,
      },
    },

    // ─── Drip Week 5 (Jun 8–12) ────────────────────────────────────
    {
      id: '08-jun-airbnb-scraper',
      name: '08 Jun - Airbnb Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Pull Airbnb listings + pricing',
        terminalTitle: 'airbnb-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.airbnb.com/s/San-Francisco/homes",
    "format": "json",
    "geo": "US-CA"
  }'`,
      },
    },
    {
      id: '09-jun-mobile-vs-desktop-demo',
      name: '09 Jun - Mobile vs Desktop Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'Mobile vs Desktop Rendering (Blackberry Included)',
        imageUrl: G(13),
      },
    },
    {
      id: '10-jun-trustpilot-scraper',
      name: '10 Jun - Trustpilot Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Trustpilot reviews at scale',
        terminalTitle: 'trustpilot-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.trustpilot.com/review/openai.com",
    "format": "json"
  }'`,
      },
    },
    {
      id: '11-jun-gemini-unblocker',
      name: '11 Jun - Gemini Unblocker',
      templateType: 'logo-pair',
      content: {
        companyName: 'Google',
        companyLogoUrl: '/web-render-api/Gemini.svg',
        imageUrl: G(14),
      },
    },
    {
      id: '12-jun-indeed-scraper',
      name: '12 Jun - Indeed Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Indeed job listings',
        terminalTitle: 'indeed-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.indeed.com/jobs?q=AI+engineer",
    "format": "json",
    "geo": "US-NY"
  }'`,
      },
    },

    // ─── Drip Week 6 (Jun 15–19) ───────────────────────────────────
    {
      id: '15-jun-crunchbase-scraper',
      name: '15 Jun - Crunchbase Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Pull company funding data from Crunchbase',
        terminalTitle: 'crunchbase-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.crunchbase.com/organization/anthropic",
    "format": "json"
  }'`,
      },
    },
    {
      id: '16-jun-markdown-output-demo',
      name: '16 Jun - Markdown Output Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'Markdown Output: Agent-Ready Web Content',
        imageUrl: G(14),
      },
    },
    {
      id: '17-jun-home-depot-scraper',
      name: '17 Jun - Home Depot Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Home Depot product + pricing',
        terminalTitle: 'home-depot-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.homedepot.com/s/power+drill",
    "format": "json"
  }'`,
      },
    },
    {
      id: '18-jun-benchmark-vs-competitors',
      name: '18 Jun - Benchmark vs Competitors',
      templateType: 'quote',
      content: {
        quoteText: 'We ran Massive, Bright Data, and Oxylabs head-to-head. Here\'s what we found.',
        quoteAuthor: 'Jason Grad',
        quoteRole: 'CEO, Massive',
      },
    },
    {
      id: '19-jun-lowes-scraper',
      name: '19 Jun - Lowes Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Lowe\'s product data',
        terminalTitle: 'lowes-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.lowes.com/search?searchTerm=circular+saw",
    "format": "json"
  }'`,
      },
    },

    // ─── Drip Week 7 (Jun 22–26) ───────────────────────────────────
    {
      id: '22-jun-vrbo-scraper',
      name: '22 Jun - VRBO Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape VRBO vacation rental listings',
        terminalTitle: 'vrbo-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.vrbo.com/search/keywords:miami",
    "format": "json"
  }'`,
      },
    },
    {
      id: '23-jun-captcha-resolution-demo',
      name: '23 Jun - Captcha Resolution Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'Captcha Resolution: Solved, Ignored, or Rejected',
        imageUrl: G(15),
      },
    },
    {
      id: '24-jun-bing-serp-scraper',
      name: '24 Jun - Bing SERP Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Get real Bing search results',
        terminalTitle: 'bing-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/search \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "q": "best AI infrastructure 2025",
    "engine": "bing",
    "awaiting": "ai",
    "geo": "US"
  }'`,
      },
    },
    {
      id: '25-jun-generic-agent-unblocker',
      name: '25 Jun - Generic Agent Unblocker (MCP)',
      templateType: 'hero-image',
      content: {
        heroTitle: 'Any agent. Any website. Unblocked.',
        heroImageUrl: G(7),
      },
    },
    {
      id: '26-jun-google-play-scraper',
      name: '26 Jun - Google Play Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Pull Google Play app store data',
        terminalTitle: 'google-play-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://play.google.com/store/apps/details?id=com.openai.chatgpt",
    "format": "json"
  }'`,
      },
    },

    // ─── Drip Week 8 (Jun 29 – Jul 3) ─────────────────────────────
    {
      id: '29-jun-ecommerce-scraper',
      name: '29 Jun - Ecommerce Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape any Shopify or ecommerce store',
        terminalTitle: 'ecommerce-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourstore.myshopify.com/products.json",
    "format": "json"
  }'`,
      },
    },
    {
      id: '30-jun-async-retrieval-demo',
      name: '30 Jun - Async Retrieval Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'Async & Scheduled Retrieval for Large Jobs',
        imageUrl: G(8),
      },
    },
    {
      id: '01-jul-truth-social-scraper',
      name: '01 Jul - Truth Social Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape Truth Social posts + profiles',
        terminalTitle: 'truth-social-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://truthsocial.com/@realDonaldTrump",
    "format": "json"
  }'`,
      },
    },
    {
      id: '02-jul-llm-brand-monitor',
      name: '02 Jul - LLM Brand Monitor',
      templateType: 'logo-showcase',
      content: {
        showcaseTitle: 'How LLMs describe your brand.',
        logos: [
          { url: '/web-render-api/chatgpt-icon.jpg', name: 'ChatGPT' },
          { url: '/web-render-api/gemini-icon.jpg', name: 'Gemini' },
          { url: '/web-render-api/perplexity-icon.jpg', name: 'Perplexity' },
          { url: '/web-render-api/copilot-icon.jpg', name: 'Copilot' },
        ],
      },
    },
    {
      id: '03-jul-website-crawler',
      name: '03 Jul - Website Crawler',
      templateType: 'terminal',
      content: {
        codeTitle: 'Crawl any website recursively',
        terminalTitle: 'web-crawler',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://docs.anthropic.com",
    "format": "markdown",
    "depth": 2
  }'`,
      },
    },

    // ─── Drip Week 9 (Jul 6–10) ────────────────────────────────────
    {
      id: '06-jul-company-info-finder',
      name: '06 Jul - Company Info Finder',
      templateType: 'terminal',
      content: {
        codeTitle: 'Multi-source company enrichment',
        terminalTitle: 'company-finder',
        codeSnippet: `curl -X POST https://api.joinmassive.com/search \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "q": "Anthropic funding CEO employees",
    "engine": "google",
    "awaiting": "answers"
  }'`,
      },
    },
    {
      id: '07-jul-speed-tiers-demo',
      name: '07 Jul - Speed Tiers Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'Speed Tiers: Light vs Ridiculous',
        imageUrl: G(9),
      },
    },
    {
      id: '08-jul-patent-scraper',
      name: '08 Jul - Patent Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Scrape USPTO and Google Patents',
        terminalTitle: 'patent-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://patents.google.com/?q=residential+proxy",
    "format": "json"
  }'`,
      },
    },
    {
      id: '09-jul-github-to-skill-creator',
      name: '09 Jul - GitHub to Skill Creator',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'New Tool',
        title: 'Turn Any GitHub Repo into an Agent Skill',
        imageUrl: G(10),
      },
    },
    {
      id: '10-jul-website-change-monitor',
      name: '10 Jul - Website Change Monitor',
      templateType: 'terminal',
      content: {
        codeTitle: 'Monitor any site for changes',
        terminalTitle: 'change-monitor',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://openai.com/pricing",
    "format": "markdown",
    "cachebust": true
  }'`,
      },
    },

    // ─── Drip Week 10 (Jul 13–17) ──────────────────────────────────
    {
      id: '13-jul-llm-tracker',
      name: '13 Jul - LLM Tracker',
      templateType: 'terminal',
      content: {
        codeTitle: 'Track how LLMs answer over time',
        terminalTitle: 'llm-tracker',
        codeSnippet: `curl -X POST https://api.joinmassive.com/ai \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "geo": "US",
    "messages": [{"role": "user",
      "content": "What is the best proxy provider?"}]
  }'`,
      },
    },
    {
      id: '14-jul-subqueries-from-ai-demo',
      name: '14 Jul - Subqueries from /ai Demo',
      templateType: 'feature-announcement',
      content: {
        featureTag: 'Feature Demo',
        title: 'See What LLMs Actually Search: /ai Subqueries',
        imageUrl: G(11),
      },
    },
    {
      id: '15-jul-app-competitor-scraper',
      name: '15 Jul - App Competitor Scraper',
      templateType: 'terminal',
      content: {
        codeTitle: 'Track competitors across App Store + Play Store',
        terminalTitle: 'app-scraper',
        codeSnippet: `curl -X POST https://api.joinmassive.com/browser \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://apps.apple.com/us/app/chatgpt/id6448311069",
    "format": "json"
  }'`,
      },
    },
    {
      id: '16-jul-q2-recap-blog-banner',
      name: '16 Jul - Q2 Recap Blog Banner',
      templateType: 'blog-announcement',
      content: {
        title: 'The Agentic Cloud: Q2 Recap and What\'s Next',
        author: 'Jason Grad',
        authorRole: 'CEO, Massive',
        imageUrl: G(12),
      },
    },
    {
      id: '17-jul-final-10-weeks-recap',
      name: '17 Jul - FINAL: 10 Weeks Recap',
      templateType: 'hero-image',
      content: {
        heroTitle: '10 weeks of the agentic cloud. Here\'s what we learned.',
        heroImageUrl: G(13),
      },
    },
  ],
};

export const INITIAL_CAMPAIGNS: Campaign[] = [WEB_RENDER_LAUNCH_CAMPAIGN];
