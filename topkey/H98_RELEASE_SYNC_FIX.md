# H98 release sync hotfix

Confirmed from the uploaded ZIP: root release.json/build.json and release-coordinator.js expected H96, but badminton and vnext build.json advertised cacheTag H98. This caused the coordinator to block both sports. All four manifests and coordinator now use identical H98 cacheTag/version/build. Hub links and service-worker registration cache-busters updated. This is a static fix only: real EdgeOne deploy and authenticated browser tests are not performed. Upload the complete ZIP atomically, not partial folders; preserve rollback.
