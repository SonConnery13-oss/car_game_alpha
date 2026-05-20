# Car Game Alpha Multiplayer

Three.js + Cannon 기반 자동차 게임에 Node.js, Express, Socket.IO 멀티플레이어 서버를 붙인 구조입니다.

## 구조

```text
client/
  index.html
  game.js
  style.css
  maps/
  physics/
server/
  server.js
package.json
```

`client`에는 기존 프론트엔드 게임 파일이 들어 있고, `server/server.js`는 Express로 `client`를 정적 서비스하면서 Socket.IO room과 플레이어 상태를 관리합니다.

## 로컬 실행

```bash
npm install
npm start
```

브라우저에서 엽니다.

```text
http://localhost:3000
```

방과 맵을 URL로 지정할 수도 있습니다.

```text
http://localhost:3000/?room=lobby&track=map1
```

## 개발 확인

```bash
npm run check
```

## 서버 동작

- 서버 포트는 `process.env.PORT || 3000`을 사용합니다.
- 클라이언트가 `multiplayer:join`을 보내면 서버가 Socket.IO `roomId` 방에 참가시킵니다.
- 서버는 현재 방의 플레이어 목록을 `multiplayer:joined`로 보내고, 새 참가자는 `multiplayer:playerJoined`로 알립니다.
- 클라이언트의 차량 상태는 `multiplayer:state`로 서버에 전송됩니다.
- 서버는 같은 방의 다른 플레이어에게 위치, 회전, 속도, 조향 상태를 broadcast합니다.
- 퇴장 시 `multiplayer:playerLeft`를 보내고 클라이언트는 원격 차량을 제거합니다.

## 배포 메모

Render나 Railway에서는 `npm install` 후 `npm start`를 실행하면 됩니다. 플랫폼이 제공하는 `PORT` 환경 변수를 서버가 자동으로 사용합니다.
