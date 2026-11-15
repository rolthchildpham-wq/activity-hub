# TOPKEY Vlog public metadata worker — staging component

This module is **not a production deployment** and does **not yet update Firebase**. It replaces the fragile JSONP/popup extraction step only after an authenticated ingestion service and Firebase writer have been integrated and tested. It needs a persistent Python runtime; EdgeOne Pages static hosting alone cannot run it as a durable queue worker.

## Strategy

- Input: individual public HTTPS TikTok video URLs (including vm/vt short URLs).
- Use `yt-dlp` via `python -m yt_dlp --dump-single-json --skip-download`; never download videos.
- Store jobs in SQLite with retry and deduplication. Invalid URLs fail before extraction.
- Map `view_count → views`, `like_count → likes`, `repost_count → shares` **only when TikTok extraction actually provides them**. Verify whether `repost_count` represents the intended share metric on representative videos before scoring a contest.
- Null means unavailable, **not zero**. Do not overwrite existing Firebase values with missing metrics.
- Source, fetched timestamp, outcome and errors must be recorded. Preserve existing score weights and permissions.
- TikTok may restrict public extraction or change its interface. Do not bypass login, CAPTCHA or rate limits; back off on failures.

## Local check

```sh
python -m pip install -U yt-dlp
python -m unittest discover -s reader-worker -v
cd reader-worker
python worker.py enqueue entries.json
python worker.py run
python worker.py export
```

`entries.json` format:

```json
[
  {"id": "test_entry_001", "url": "https://www.tiktok.com/@creator/video/7340000000000000000"}
]
```

Set `TOPKEY_TIKTOK_QUEUE_DB` to a persistent disk path and `TOPKEY_TIKTOK_DELAY_SECONDS` to a conservative delay. Start with a few confirmed public URLs and compare extracted values against the TikTok screen manually.

## Required integration gates (not completed)

1. Add an authenticated API for ADMIN or scoped DIY/BTC to enqueue. Never expose an unauthenticated scraper endpoint or public Firestore/RTDB write key.
2. Use service-side Firebase Admin SDK and narrowly scoped updates to `topkey_vlog2026/entries/{id}`. Validate existing URL and current permissions before write; enforce idempotency, batching, cooldown and safe retry.
3. Test score mapping and the source against representative TikTok URLs, including unavailable views/likes/shares, deleted/private videos, timeouts and throttling.
4. Update the Vlog UI to show queue progress, last successful sync, partial-data flags and manual fallback; remove popup/JSONP dependency only **after** backend is live.
5. Run TOPKEY Production Gate in full: static tests, authenticated browser/mobile smoke, Firebase rules matrix, slow 4G, preview deployment SHA, and explicit production release approval.
6. Deploy static EdgeOne assets using authenticated EdgeOne API/CLI directly, *not GitHub Actions*. This repository branch is **not deployed**; EdgeOne account authorization is still required.

## Visual screenshot fallback

A browser screenshot can support **human review** of visible values on a few videos, but OCR/image interpretation is neither a reliable structured data source nor practical for large-volume sync. Never silently replace an unavailable value with a guessed screenshot reading.

## Existing production path

The current Vlog JS still points to the separately hosted Reader V2 JSONP service. Do **not** merge the worker alone expecting production link syncing to work.
