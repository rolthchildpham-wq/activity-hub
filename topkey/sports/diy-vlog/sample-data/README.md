# TOPKEY Vlog TEST LAB — 1,000 observed TikTok video URLs

**Test only. Do not import into `topkey_vlog2026` or treat these as contest entries.**

The `tiktok-public-1000.json` fixture holds exactly **1,000 distinct TikTok video IDs/URLs**, selected from two public GitHub CSV datasets:
- **933** video URLs from [Bright Data TikTok Posts sample](https://github.com/luminati-io/tiktok-posts-dataset-samples), filtered to rows where `post_type=video`
- **67** additional unique URLs from [Bright Data Social Media TikTok sample](https://github.com/luminati-io/Social-media-dataset-samples)

Source records were retrieved on **2026-11-15**. The dataset is **not Vietnam-only**, and region attribution is not verified. This fixture contains URL, public video ID, and a source tag only; no captions, comments, or private user information.

The URLs are **observed links**, not guaranteed to still be available. In an 8-link `yt-dlp` sample smoke test, **7 returned View/Like/Share counters**, **1 was blocked by TikTok for the testing IP**. Full 1,000-link availability and Firebase writes remain unverified.

Use the Vlog admin TEST LAB button to load the packaged URLs, or use the CSV/TXT/JSON file input to import your own list. Both routes accept only actual `https://www.tiktok.com/@user/video/ID`-style URLs and de-duplicate by video ID (max 1,000).

The app writes the imported URL list **only** to `topkey_vlog2026_test` via the signed-in Firebase client and existing database rules. Counters begin at 0 solely as placeholders; the `statsSource` field marks them as unverified. Metadata refresh then runs in **40 batches of 25**, carrying the batch cursor forward in local browser storage.

The importer **replaces any previous TEST root** after confirming with the logged-in ADMIN. It never changes `topkey_vlog2026` by design. Server and Firebase permissions must still be verified end-to-end before enabling production use.

Tests (Node, no GitHub Actions required):
```sh
node scripts/test_vlog_sample_import.cjs
node scripts/test_vlog_batches.cjs
```
