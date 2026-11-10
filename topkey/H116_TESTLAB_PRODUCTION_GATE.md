# Test Lab ≡ Production — H116 Report Acceptance

Use the exact same app module code and report engine for Test Lab and Production; only the namespace and test data differ. No Test Lab-specific mock is evidence of a production pass.

| Test | Test Lab | Production-like staging | Gate |
|---|---|---|---|
| Release manifest and cache H116 | required | required | P0 |
| Sign in once; role checks | required | required | P0 |
| Full teams/matches and final rankings | required | required | P0 |
| Prize editor, post-lock admin update | required | required | P0 |
| Final report HTML award table | required | required | P0 |
| Final PDF actual downloaded file has body ink on every page | required | required | P0 |
| Correct 7 sport template PPTX and user edited compatible file | required | required | P0 |
| Report photos and custom text | required | required | P1 |
| Financial totals and receipts as printable appendix | required | required | P0 |
| Viewer links and role privacy | required | required | P0 |
| Browser RAM/leaks/redirects | required | required | P1 |

**Current outcome:** the local simulated PDF/PPT and static gates pass. Real authenticated staging and all 185 feature checks have not been completed; no production certificate issued.
