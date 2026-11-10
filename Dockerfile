# The site as one container, for Railway (which builds a root Dockerfile on its own): the app from dist/, the API from
# dist-server/ (server/index.ts), and Playwright's Chromium with its system libraries for /api/render. Vercel doesn't
# use this; it keeps building from vercel.json.

# --- Build: the app (vite build) and the server bundle ---
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run build:server

# --- Run: production dependencies, Chromium, and the built files ---
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY package.json package-lock.json ./
# playwright-core's own installer, so Chromium matches its version; --with-deps adds the libraries and fonts it needs.
# The headless shell is all a render uses.
RUN npm ci --omit=dev \
 && npx playwright-core install --with-deps --only-shell chromium \
 && apt-get install -y --no-install-recommends fontconfig \
 && npm cache clean --force \
 && rm -rf /var/lib/apt/lists/*
# The emoji font the Vercel function adds, so emoji in a field render the same on both
COPY api/_lib/fonts/NotoColorEmoji.ttf /usr/share/fonts/truetype/noto/NotoColorEmoji.ttf
RUN fc-cache -f
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
# /api/render and /api/images read the image projects from here (api/_lib/render-image.ts)
COPY --from=build /app/public/image-projects ./public/image-projects
EXPOSE 3000
CMD ["node", "dist-server/index.mjs"]
