# Massive Designer

Where Massive's designs get made: social images, LinkedIn carousels and GIFs, videos, decks, posters and other print,
and merch. You tell Claude Code what you need in plain words. It builds the design on-brand, renders the file and
tells you where it is.

## What you can make

| You want | For example |
|---|---|
| **A still image** | A LinkedIn or X post, a LinkedIn carousel (as a PDF), a link preview, a YouTube thumbnail, a LinkedIn cover, an email header, a hiring or welcome card |
| **Something that moves** | A looping LinkedIn GIF, a video with a voiceover, a launch teaser |
| **Slides** | A pitch or sponsorship deck, as a PDF or PowerPoint |
| **Print** | A poster, flyer, one-pager, business card, sign, menu or document, at any paper size; trade-show roll-ups; buttons, pins and stickers |

Market maps and top-N rankings come from a spreadsheet, with no Claude needed: use Market Map and Top List on the
deployed site, [massive-designer.vercel.app](https://massive-designer.vercel.app/), or at `http://localhost:5173`
after `npm run dev`.

## Set up (once)

1. **Install the basics** on your Mac:
   - [Homebrew](https://brew.sh), then in Terminal: `brew install ffmpeg gh`
   - [Node.js 24](https://nodejs.org) (the LTS installer)
   - [Claude Code](https://claude.com/claude-code)
2. **Get access:** ask the repo owner (jaraujo-mssv on GitHub) to add you to the repo. Then sign in to GitHub from
   Terminal: `gh auth login`.
3. **Get the repo:**
   ```bash
   gh repo clone jaraujo-mssv/massive-designer
   cd massive-designer
   npm install
   npm run setup
   ```
   `npm run setup` installs the rest (the renderers and Claude's video skills) and tells you if anything is still
   missing. Run `npm run doctor` any time to check again.
4. **Optional keys:** voiceovers and AI photos need API keys. Copy `.env.example` to `.env` and ask for the keys you
   need.

## Ask for a design

In the `massive-designer` folder, run `claude` (or open the folder in the Claude desktop app or VS Code). Then just
ask, for example:

- "Make a LinkedIn post image announcing our Web Render API. Light background. Headline: Real-time web access for
  your AI."
- "Turn these five points into a LinkedIn carousel." (paste the points)
- "Make a looping LinkedIn GIF that shows one API reaching 195 countries."
- "Make an A3 poster for our Prague meetup on 12 November."
- "Make a business card for Ana Silva, Head of Sales, ana@joinmassive.com."
- "Make the OG image for our blog post 'Why AEO is the new SEO'."

You can also type `/massive-design` and then describe what you need. Claude asks for anything that's missing (the
copy, the size, light or dark), starts from the closest existing design, renders it, checks it against the brand guide
and tells you where the file is. Ask for changes the way you'd ask a designer.

Claude never makes up numbers. Give it the figures, or point it to where they come from.

## Where your files are

| Design | File |
|---|---|
| Images | `output/images/<name>.jpg` (carousels: `<name>.pdf`) |
| GIFs | `public/video-projects/<name>/gif/` |
| Videos | `output/video/<name>.mp4` |
| Decks | `output/deck/<name>.pdf` and `.pptx` |
| Print | `output/print/<name>.pdf` |

Post or send these files yourself. The `output/` folder stays on your computer.

## Make an image from any AI chat

The image templates (blog banner, hiring post, welcome card…) also work from ChatGPT, Claude, Gemini or any chat
that can read a web page. You don't need this repo.

1. In the Images tab, click **Use with AI**. It copies this prompt:
   `Read https://massive-designer.vercel.app/llms.txt and use it to make me a Massive image. Here's what I need:`
2. Paste it into the chat and say what you want, e.g. *"a blog banner called 'Hotel Prices Without a Browser' with
   this photo: https://…/hotel.jpg"*.
3. The chat gives you two links:
   - **Image:** opens the finished JPG.
   - **Edit:** opens the design in the Images tab, filled in, to tweak it or drop in a photo you only have as a
     file.

Photos must be a direct link to the image file. Share pages from Google Drive, Dropbox or Unsplash don't work; use
the edit link and upload the photo instead.

For a Claude Project or a custom GPT, paste the contents of
[llms.txt](https://massive-designer.vercel.app/llms.txt) into its knowledge or instructions; a link alone there
isn't fetched. In the Images tab, **Copy image link** gives the link for the image as you've edited it.

## Share a design with the team

Say "share this design". Claude puts it on its own branch and opens a pull request, and the repo owner reviews and adds
it to the library. Before you start something new, say "get the latest designs" so you're working from the newest
version.

## The brand

[`brand/BRAND.md`](brand/BRAND.md) is the visual guide: the dark and light looks, colours, type, logo use and sizes for
each channel. [`brand/assets.md`](brand/assets.md) lists the logo files. Claude follows both; read them if you want to
know why a design looks the way it does.

## For engineers

[`CLAUDE.md`](CLAUDE.md) covers the stack (React 18, Vite, Tailwind, deployed on Vercel), the rules for changes, and
every tool and pipeline. The design notes for each tool are in [`docs/plans/`](docs/plans/), and the pipelines'
skills are in [`.claude/skills/`](.claude/skills/).
