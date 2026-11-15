# Vlog feature status — 2026-11-15

| Feature | Code / observed state | Production verified? |
| --- | --- | --- |
| Public ranking, Top 3, weighted scores, CSV | Present in Vlog UI; weighted formula 1/1/1 was observed in browser | Partial browser text inspection only |
| ADMIN login / DIY BTC | Firebase Auth code present; browser tab reports successful admin verification | Full role matrix NOT TESTED |
| Edit entries and weighting | Code present | Write permission / mobile NOT TESTED |
| Viewer share snapshot | Code present | End-to-end NOT TESTED |
| Public TikTok link read | Reader V2 JSONP/popup currently in use | FAIL: observed JSONP load error and Network Error |
| Bulk metadata sync | 25 link cap per run; popup required | FAIL: observed 1/1 failed; scalability NOT TESTED |
| New Python metadata worker | Added on isolated fix branch | Source only; unit tests not run on GitHub; not integrated/deployed |
| Direct EdgeOne deployment (no GitHub Actions) | Required release workflow | BLOCKED: EdgeOne authorization and full production gate outstanding |
| Firebase rules | Existing repository rules unchanged | Deployed rules / role writes NOT TESTED |

Do not advertise automatic TikTok sync as operational until backend and deployment gates pass. TikTok OAuth, when used, remains an independent optional creator-consent path.
