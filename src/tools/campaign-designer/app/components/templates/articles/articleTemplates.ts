import { ArticleOne } from './ArticleOne';
import { ArticleTwo } from './ArticleTwo';
import { ArticleThree } from './ArticleThree';
import { ArticleStats } from './ArticleStats';
import { ArticleInstall } from './ArticleInstall';
import { ArticleHostShowcase } from './ArticleHostShowcase';
import { ArticleContent, ArticleProps, DEFAULT_ARTICLE_CONTENT } from './articleTypes';
import { Platform } from '../../../types';

export interface ArticleTemplate {
  id: string;
  name: string;
  Component: React.ComponentType<ArticleProps>;
  content: ArticleContent;
  platforms?: Platform[];
  linkedinCopy?: string;
  xCopy?: string;
}

const MCP_ANNOUNCEMENT_CONTENT: ArticleContent = {
  title: 'Massive MCP',
  tagline: 'Web Render for any AI agent',
  stats: [
    { value: '1',     label: 'NPM Install',   description: 'One command, any MCP-compatible agent' },
    { value: '3',     label: 'Endpoints',     description: 'Chat, search, and render — exposed as MCP tools' },
    { value: '4',     label: 'Frontier LLMs', description: 'ChatGPT, Gemini, Perplexity, and Copilot' },
    { value: '195+',  label: 'Countries',     description: 'Geo-target every tool call by country and city' },
  ],
  bgImageUrl: '/web-render-api/Gradient 09.jpg',
  logoUrl: '/logo.svg',
};

const MCP_ANNOUNCEMENT_LINKEDIN = `Plug an agent into the live web and you're suddenly maintaining proxies, browser pools, captcha solvers, geo routing, and a SERP parser. None of which is the actual agent work.

Massive MCP collapses that into one npm install.

One MCP server, three tools your agent gains as native function calls:

/ai → query ChatGPT, Gemini, Perplexity, Copilot
/search → live Google SERPs and AI Overviews
/render → any URL, geo-routed across 195 countries

Drop a 9-line block into your Claude Desktop, Cursor, Windsurf, Continue, or any MCP host config. Prompt your agent. It now reads the web in real time.

No browser pools to manage. No proxy rotation. No second dashboard or auth flow. The Massive API key you already have powers it.

Open source. MIT licensed. On npm as @joinmassive/mcp-server.

Docs and install instructions in the first comment 👇`;

const MCP_ANNOUNCEMENT_X = `Wire your agent to the live web in two minutes.

One npm install. Three new tools (/ai, /search, /render) inside Claude, Cursor, Windsurf, or any MCP host.

Open source on npm as @joinmassive/mcp-server. Docs ↓`;

const MCP_INSTALL_CONTENT: ArticleContent = {
  eyebrow: 'Massive MCP',
  title: 'Two minutes to plug in',
  endpoints: [
    { name: '1. Install',   description: 'npm install -g @joinmassive/mcp-server', descriptionIsCode: true, descriptionWrap: true },
    {
      name: '2. Configure',
      description: `{
  "mcpServers": {
    "massive": {
      "command": "npx",
      "args": ["-y", "@joinmassive/mcp-server"],
      "env": {
        "MASSIVE_TOKEN": "your_api_key_here"
      }
    }
  }
}`,
      descriptionIsCode: true,
    },
    {
      name: '3. Prompt',
      description: `Use Massive MCP to search "best AI coding assistant" across Google (organic + AI Overview), ChatGPT, Perplexity, and Gemini — geo-targeted to NYC, London, and SF. List competitors by avg rank and build me a visibility report. Then propose 5 concrete actions to improve my ranking, ranked by likely lift.`,
      descriptionIsCode: true,
      descriptionWrap: true,
    },
  ],
  bgImageUrl: '/web-render-api/Gradient 14.jpg',
  logoUrl: '/logo.svg',
};

const MCP_INSTALL_LINKEDIN = `Wiring an agent to the open web used to take months. Proxy rotation, captcha resolution, browser pool orchestration, SERP parsing, geo-routing, sticky sessions, retry logic. All before the agent ever did anything interesting.

Now it's three steps:

1. npm install -g @joinmassive/mcp-server
2. Add a 9-line block to your Claude Desktop, Cursor, Windsurf, or Continue config
3. Prompt your agent

Your agent now has /ai, /search, and /render as native tool calls. Live Google SERPs. Frontier LLMs as a function call. Any URL rendered, geo-routed, ready to feed back into your pipeline.

No proxies to maintain. No browser pool. No second bill. The Massive API key you already have covers it.

Free to install. You pay only for the calls your agent makes.

Install instructions in the first comment 👇`;

const MCP_INSTALL_X = `Wiring an agent to the live web used to take months. Proxy pools, captcha solvers, SERP parsers, geo routing.

Now: npm install -g @joinmassive/mcp-server, add 9 lines to your MCP config, prompt your agent.

Two minutes. Install ↓`;

const MCP_ANY_HOST_CONTENT: ArticleContent = {
  title: 'Drop-in for any MCP host',
  tagline: 'Claude, Cursor, Windsurf — any MCP-compatible agent',
  logos: [
    { url: '/web-render-api/claude-icon.jpg',   name: 'Claude' },
    { url: '/web-render-api/cursor-icon.jpg',   name: 'Cursor' },
    { url: '/web-render-api/windsurf-icon.jpg', name: 'Windsurf' },
    { url: '/web-render-api/continue-icon.jpg', name: 'Continue' },
  ],
  bgImageUrl: '/web-render-api/Gradient 11.jpg',
  logoUrl: '/logo.svg',
};

const MCP_ANY_HOST_LINKEDIN = `Every agent platform used to ship its own tool format. Anthropic SDK in Claude, function calling in OpenAI, plugins for Cursor, bridges for Windsurf. Four integrations to maintain, one product to ship.

MCP fixes that. One protocol, every host.

Massive MCP plugs into all of them with one npm install:

Claude Desktop and Claude Code (native MCP)
Cursor (direct config, no extension)
Windsurf (zero-setup MCP support)
Continue (any other MCP-compliant client)

What your agent gains is the same in every host:

/ai → query ChatGPT, Gemini, Perplexity, Copilot
/search → real Google SERPs and AI Overviews
/render → any URL, geo-targeted to 195 countries

No vendor lock-in. No platform-specific glue. The source is on GitHub. MIT licensed.

Install instructions in the first comment 👇`;

const MCP_ANY_HOST_X = `Every agent platform used to need its own tool format. Cursor wants one thing, Claude another, Windsurf a third.

MCP fixes that. One protocol, every host.

Massive MCP runs in all of them with one npm install. Open source.

Docs ↓`;

export const ARTICLE_TEMPLATES: ArticleTemplate[] = [
  { id: 'article-one',      name: 'Launch Post',      Component: ArticleOne,           content: DEFAULT_ARTICLE_CONTENT },
  { id: 'mcp-announcement', name: 'MCP Announcement', Component: ArticleStats,         content: MCP_ANNOUNCEMENT_CONTENT, platforms: ['linkedin', 'twitter'], linkedinCopy: MCP_ANNOUNCEMENT_LINKEDIN, xCopy: MCP_ANNOUNCEMENT_X },
  { id: 'mcp-install',      name: 'MCP Install',      Component: ArticleInstall,       content: MCP_INSTALL_CONTENT,      platforms: ['linkedin', 'twitter'], linkedinCopy: MCP_INSTALL_LINKEDIN,      xCopy: MCP_INSTALL_X },
  { id: 'mcp-any-host',     name: 'MCP Any Host',     Component: ArticleHostShowcase,  content: MCP_ANY_HOST_CONTENT,     platforms: ['linkedin', 'twitter'], linkedinCopy: MCP_ANY_HOST_LINKEDIN,     xCopy: MCP_ANY_HOST_X },
];
