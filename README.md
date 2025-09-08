## Chat-app

Modern real‑time chat and calling app built with Spring Boot (backend) and React + TypeScript (frontend). Supports text chat, presence, read receipts, typing indicators, and 1:1 audio/video calls via WebRTC over STOMP/WebSocket signaling.

### Preview

<!-- Replace the placeholders below with your images (drag/drop on GitHub or link from /docs/assets) -->
<!-- ![Landing](docs/assets/landing.png) -->
<!-- ![Chat UI](docs/assets/chat-ui.png) -->
<!-- ![Video Call](docs/assets/video-call.png) -->

### Features

- **Authentication**: JWT + OAuth2 login
- **Real‑time messaging**: STOMP over WebSocket
- **Presence and typing**: online status, typing indicators, read receipts
- **Calls**: 1:1 audio/video using WebRTC, ICE/STUN, in‑app signaling
- **Attachments**: message attachments (images/files)
- **Dockerized**: `docker-compose` for local all‑in‑one spin‑up

### Tech Stack

- **Backend**: Java 17, Spring Boot, Spring Security, STOMP/WebSocket, Gradle
- **Frontend**: React 18, TypeScript, Vite/CRA (as configured), Tailwind + custom CSS
- **RTC**: WebRTC (getUserMedia, RTCPeerConnection, ICE candidates), Google STUN
- **Build/Run**: Docker + docker‑compose (optional)

### Repository Layout

```
Chat-app/
  backend/           # Spring Boot app
  frontend/          # React + TypeScript app
  docker-compose.yml # Full stack orchestration
```

### Quick Start

1) Clone and prepare environment
```
git clone <your-repo-url> Chat-app
cd Chat-app
cp env.example .env  # adjust values if needed
```

2) Run with Docker (recommended)
```
docker compose up --build
```

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`

3) Run locally without Docker

- Backend (Windows PowerShell)
```
cd backend
./gradlew bootRun
```

- Frontend
```
cd frontend
npm install
npm start
```

### Configuration

See `env.example` for the most common settings. Key values:

- **JWT secret** and expiry (backend)
- **Frontend origin** for CORS
- **OAuth2 providers** (if enabled)

Backend application properties live at:
`backend/src/main/resources/application.properties`

### Calling (WebRTC) Notes

- Browser may block autoplay audio; the app resumes `AudioContext` after a user gesture.
- When testing both caller and callee on the same laptop, the camera can only be used by one side at a time. Workarounds:
  - Use two devices or profiles
  - Use a virtual camera (OBS Virtual Camera) for one side
  - Or run Chrome with flags:
```
--use-fake-device-for-media-stream --use-fake-ui-for-media-stream
```

### Common Troubleshooting

- "Skipping WebSocket subscriptions – not connected": harmless during startup; resolves after STOMP connects.
- "Could not establish connection. Receiving end does not exist.": Chrome extension noise; ignore.
- Video black on receiver when both peers are on one machine: camera busy; see Calling Notes above.
- If the call modal lingers after a hang‑up, ensure both frontend and backend are on latest code; the app now sends immediate local teardown and listens for peer connection state.

### Development Scripts

Backend:
```
cd backend
./gradlew clean build
```

Frontend:
```
cd frontend
npm run build
```

<img width="1919" height="869" alt="image" src="https://github.com/user-attachments/assets/4b51ce5e-c714-4e61-875d-191aeb0137ab" />

<img width="1919" height="867" alt="image" src="https://github.com/user-attachments/assets/e8eecb26-68a0-4f65-b41b-9393cf8ebdb9" />


### License

MIT – see `LICENSE` (add one if missing).


