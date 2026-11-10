# HOÀN THIỆN — TOPKEY production roadmap

Keyword: **HOÀN THIỆN** = continue the TOPKEY improvement roadmap in order, with regression tests before release.

- Upgrade108 Cache Correctness — DONE
- Upgrade109 Viewer Minimal Boot — DONE
- Upgrade110 Admin Login Boot Guard — DONE
- Upgrade111 Feature Code Splitting — DONE
- Upgrade112 Viewer Firebase Window — DONE
- Upgrade113 Atomic Score Pipeline — DONE
- Upgrade114 Consolidation Phase 1 — DONE
- Upgrade115 Consolidation Phase 2 (data/runtime wrappers → core modules) — DONE
- Upgrade116 Consolidation Phase 3 (Schedule/Umpire/Live feature boundaries) — DONE
- Upgrade117 Final Production Hardening / Long-session Soak — DONE

## Production baseline after Upgrade117

The planned optimization/consolidation roadmap is complete. Future **HOÀN THIỆN** work should begin from production measurements or a concrete defect, not by adding another patch layer automatically.

Upgrade117 locks these release gates:
- Data/Auth boot is single-flight.
- Firebase queue drains are serialized/coalesced across reconnect/online/action storms.
- Resume recovery is coalesced and authenticated/connected-gated.
- UI/Firebase listener ownership survives 100 resubscribe cycles + 1,200 tab changes without growth.
- Atomic Score Pipeline survives 500 point/commentary actions with zero pending leak.
- Viewer Minimal Boot, Viewer Firebase Window, Fast Lane, TURN/WebRTC, BLV, Rules and Replay remain protected by prior regression contracts.


## Final production acceptance
Upgrade118 is the clean production artifact baseline. Future “HOÀN THIỆN” work starts from measured production evidence; do not add patch versions without a concrete regression or measurable benefit.

## Production baseline decision — Upgrade118

- Upgrade118 Production Artifact Cleanup / Dependency Hygiene: ✅ DONE
- Full release acceptance: ✅ GO
- Next automatic patch: **NONE**

When the user says **HOÀN THIỆN** after Upgrade118, first inspect production evidence/Health or a concrete requested feature. Do not create another upgrade merely to increase the version number. Remaining Firebase modular/full legacy rewrite items are documented in `sports/badminton/ARCHITECTURE_DEBT.md` and are intentionally deferred.
