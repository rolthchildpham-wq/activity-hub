# TURN setup for Upgrade88C

The current `turn-config.json` contains STUN only. If Viewer reports ICE failure, add a real TURN service credential to `iceServers`.

Example structure (replace every placeholder with credentials from your TURN provider):

```json
{
  "iceServers": [
    {"urls":"stun:stun.l.google.com:19302"},
    {"urls":["turn:YOUR_TURN_HOST:3478?transport=udp","turn:YOUR_TURN_HOST:3478?transport=tcp"],"username":"YOUR_USERNAME","credential":"YOUR_CREDENTIAL"},
    {"urls":"turns:YOUR_TURN_HOST:5349?transport=tcp","username":"YOUR_USERNAME","credential":"YOUR_CREDENTIAL"}
  ]
}
```

Both broadcaster and Viewer load this file before creating RTCPeerConnection. Prefer time-limited TURN credentials in production.
