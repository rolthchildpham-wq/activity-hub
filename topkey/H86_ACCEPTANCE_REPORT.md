# H86 Acceptance Report

Release: `u122h86-20261107`

## Automated acceptance

Final working tree result: `FULL_WEB_ACCEPTANCE_OK 419`.

Coverage includes:

- ADMIN + BTC Badminton + BTC Volleyball auth matrix;
- Firebase auth integration mocks and reload behavior;
- H83/H84/H85 -> H86 session migration;
- atomic release guard and no legacy version downgrade;
- JS syntax and referenced asset existence;
- report PDF binary smoke;
- report language completeness in VI-EN / VI-ZH / EN-VI-ZH;
- Badminton Test Lab finance injection and expected totals;
- VNext common interaction parity;
- real PptxGenJS generation for Badminton and VNext;
- embedded image media + image slide in generated PPTX;
- current ranking/withdrawal regression tests.

## Real PPTX validation

A real PptxGenJS export was generated and unzipped. It contains Finance Summary and Finance Detail slides. A second export embeds an image and produces an additional image slide plus `ppt/media` entries.

Rendered slide QA passed `slides_test.py` with no overflow detected.

## Environment limitation

The execution environment blocks browser navigation to localhost/file URLs, so H86 does not claim a full interactive Chromium click-through. Auth behavior is covered by Firebase mocks/state-machine integration tests. The package must still be exercised on the EdgeOne production domain after an atomic deploy, with the H86 build badge visible in Hub, Badminton, and VNext before accepting production traffic.
