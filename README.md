# RAVEN — TikTok LIVE Music Avatar (GitHub Pages Edition)

A 1080×1920 RAVEN portrait livestream overlay with **no localhost server and no Cloudflare tunnel**. The gaming-room background and character are still PNG images. Only the red sound wave behind the character moves.

## What gets hosted where?

- **GitHub Pages**: `index.html` (overlay) and `control.html` (web control interface), including the PNG images.
- **Supabase Realtime**: Relays low-bandwidth sound-wave values (not your actual music or microphone recordings) from Chrome control to the overlay in TikTok LIVE Studio.
- **Chrome on your streaming PC**: Captures sound *only after you explicitly click Start sharing and grant permission*. For Spotify in the browser, select the Spotify tab and turn ON “Share tab audio”. Windows Spotify app audio may not be available through Chrome tab capture; share screen/system audio if Chrome offers that option, or play Spotify Web Player in a tab.

The overlay image can be opened on GitHub Pages immediately; live music animation needs the Supabase setup.

## Setup: GitHub

1. Sign into https://github.com and create a **public** repository called `RAVEN-Live-Avatar`.
2. Upload **all the contents** of this ZIP to the repository **root** (do not upload the ZIP as a single file).
3. Open repository **Settings → Pages → Build and deployment → Deploy from a branch**.
4. Choose **main** and **/(root)**, then click **Save**.
5. GitHub Pages will publish links in the format (replace `YOUR_USERNAME`):
   - Overlay: `https://YOUR_USERNAME.github.io/RAVEN-Live-Avatar/`
   - Control: `https://YOUR_USERNAME.github.io/RAVEN-Live-Avatar/control.html`

## Setup: Supabase Realtime (needed for actual live animation)

1. Create a project at https://supabase.com and open its Connect/Project settings area.
2. Copy your **project URL** and your **publishable key**, and paste them into `config.js`:

   ```js
   window.RAVEN_CONFIG = {
     supabaseUrl: 'https://your-project-ref.supabase.co',
     publishableKey: 'sb_publishable_...'
   };
   ```

3. Commit the updated `config.js` to the GitHub repository. **Never publish a secret or service-role key.**
4. Open your GitHub Pages `control.html`, wait for the status to show **Connected**.
5. Click **Copy TikTok overlay URL**. It automatically includes a randomly generated room identifier.
6. Open that exact URL in Chrome and paste it into TikTok LIVE Studio → Add Source → Link.
7. Turn ON **Custom resolution**, Width **1080**, Height **1920**. Resize the source in your 9:16 TikTok scene to fill the entire canvas.
8. Return to `control.html`. Click **Test wave for 12 seconds**. The red sound wave should move in both Chrome preview and TikTok; everything else remains static.
9. Click **Start sharing music/tab audio**, choose the tab playing music, enable **Share tab audio**, then play the song.
10. Leave the Chrome control tab open during your live. You do **not** need the old Python server or a Cloudflare tunnel for this setup.

## Important limitations / security

- GitHub Pages alone cannot run Python, process local Windows audio, or provide a realtime server.
- This package uses a **public Realtime channel**, whose room identifier is not equivalent to secure account authentication. Anyone who knows the room URL and your public project settings may be able to send fake wave data. For a production-grade secure control page, add Supabase user auth and private channel policies.
- If Chrome does not expose a shared audio track, the waves cannot react. Use Spotify Web Player in a shareable browser tab, or a supported system audio capture method.
- The browser asks for permission before audio capture; it does not secretly capture PC audio.
- Supabase account/project setup is required; GitHub itself does not provide the realtime relay.
- The JS imports the current Supabase client from jsDelivr; an internet connection is required.
- This package hasn't been live-tested with your particular TikTok LIVE Studio or Supabase account. Use the 12-second test before streaming.
