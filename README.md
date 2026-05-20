# Car Game Alpha Multiplayer

Three.js + Cannon racing game served by one Node.js process.

The deployment target is a Node.js host such as Render or Railway. GitHub is only
used as the code repository. GitHub Pages does not run Node.js, so it is not used
for the multiplayer deployment.

## Project Structure

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

`server/server.js` does both jobs:

- serves every file in `client/` with Express
- runs the Socket.IO server on the same domain

Because the client loads `/socket.io/socket.io.js` and connects with `io()`, the
browser automatically connects back to the same deployed server that served the
game page.

## Local Run

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Optional room/map URL:

```text
http://localhost:3000/?room=lobby&track=map1
```

## Checks

```bash
npm run check
```

## Render Deployment

Create a Render Web Service from this GitHub repository.

- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Port: use Render's provided `PORT` environment variable automatically

The server reads `process.env.PORT || 3000`, so no hard-coded localhost port is
required in production.

## Railway Deployment

Create a Railway project from this GitHub repository.

- Railway detects `package.json`
- Install Command: `npm install`
- Start Command: `npm start`
- Public Networking: expose the generated Railway domain for the service

Railway provides `PORT`; `server/server.js` listens on that port automatically.

## Important Notes

- Do not deploy this multiplayer version with GitHub Pages.
- GitHub Pages can only serve static files and cannot run `server/server.js`.
- Use the Render or Railway URL as the game URL.
- One deployed URL serves both the game screen and the Socket.IO multiplayer
  server.
