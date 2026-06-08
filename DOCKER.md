# Running bnabd with Docker

This runs the whole app — **database + backend + frontend** — with one command.
You don't need Java, Maven, Node, or PostgreSQL installed. Just Docker.

## 1. Install Docker (one time per PC)

- **Windows / Mac**: install **Docker Desktop** from <https://www.docker.com/products/docker-desktop/>.
  After installing, start Docker Desktop and wait until it says "running".
- **Linux**: install Docker Engine + the Compose plugin
  (<https://docs.docker.com/engine/install/>).

Check it works by opening a terminal and running:

```
docker --version
docker compose version
```

Both should print a version number.

## 2. Get the project onto the PC

Copy the whole project folder (the one containing `docker-compose.yml`) to the
machine — via git clone, a USB stick, a zip, whatever. Open a terminal **inside
that folder**.

## 3. Launch it

```
docker compose up --build
```

The first time, this downloads base images and builds everything, so it can take
a few minutes. When it's ready you'll see the services logging steadily. Then open:

- **App (frontend):** <http://localhost:3000>
- **Backend API / Swagger docs:** <http://localhost:8080/swagger-ui.html>

Log in with one of the seeded accounts:

| Username | Password   | Role  |
|----------|------------|-------|
| admin    | admin123   | ADMIN |
| host     | host123    | HOST  |
| user     | user123    | USER  |

## 4. Stop it

Press `Ctrl+C` in the terminal, then:

```
docker compose down
```

Your data is kept in a Docker volume (`db_data`), so it survives restarts.
To also **wipe the database** and start fresh:

```
docker compose down -v
```

## Everyday commands

```
docker compose up -d            # start in the background (no log spam)
docker compose up -d --build    # rebuild after you change the code, then start
docker compose logs -f          # watch logs (Ctrl+C to stop watching)
docker compose logs -f backend  # logs for just one service
docker compose ps               # see what's running
docker compose down             # stop everything
```

## Configuration (optional)

Settings have sensible defaults baked in, so you can ignore this for a normal
single-PC run. To override, create a file named `.env` next to
`docker-compose.yml`:

```
# A long random secret for signing login tokens (>= 32 characters)
JWT_SECRET=please-change-me-to-something-long-and-random

# Only needed if the browser is NOT on the same PC as the containers
# (e.g. opening the app from your phone on the same Wi-Fi). Set this to the
# server PC's IP, then rebuild with: docker compose up -d --build
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.50:8080
```

> **Why `NEXT_PUBLIC_API_BASE_URL` matters:** the frontend's API calls run in
> *your browser*, not inside the container. The browser reaches the backend
> through the host's port `8080`. On the same PC that's `localhost:8080` (the
> default), so nothing to do. From another device, swap in the server PC's IP.
> Because Next.js bakes this value in at build time, you must `--build` after
> changing it.

## Ports used

| Service  | Inside container | On your PC          |
|----------|------------------|---------------------|
| frontend | 3000             | http://localhost:3000 |
| backend  | 8080             | http://localhost:8080 |
| database | 5432             | not exposed (internal only) |

If port 3000 or 8080 is already taken on your machine, edit the left-hand number
under `ports:` in `docker-compose.yml` (e.g. `"3001:3000"`) and use that instead.

## Troubleshooting

- **"port is already allocated"** — something else uses 3000/8080. Change the
  host port as described above, or stop the other program.
- **Frontend loads but can't reach the backend / login fails** — the backend may
  still be starting (it waits for the DB to be healthy). Give it ~30s, or check
  `docker compose logs backend`.
- **Changed the code and don't see it** — rebuild: `docker compose up -d --build`.
- **Start completely clean** — `docker compose down -v` then
  `docker compose up --build`.
