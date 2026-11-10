# H97 emergency fix — login and Vietnamese encoding

Root cause confirmed: the H97 bundler inserted its script tag using a global string replacement of `</body>`. The page contains `</body>` inside a quoted HTML string in the early canonical-host inline script. The replacement injected an actual `<script>` tag into that string, terminating the inline script and exposing `}catch(e){}}();` as page text.

Fix: remove the erroneous injected script tag from the early inline script; keep exactly one bundle script at the actual end of body; put UTF-8 charset first in head; fix the builder to replace only the final closing body tag.

Static checks: parsed HTML contains one canonical inline script, one bundle script, and one login screen. Node syntax check of bundle passed. Live Firebase sign-in and browser end-to-end have NOT been tested; this is an emergency staging candidate. Keep H96 as rollback until login and Vietnamese text are confirmed on staging.
