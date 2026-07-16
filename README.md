# DeployReady — Kora Analytics

A containerised Node.js API with an automated test → build → push → deploy
pipeline, running on an AWS EC2 instance.

## Architecture overview

```
 GitHub push to main
        │
        ▼
 ┌────────────────────┐
 │ GitHub Actions      │
 │ 1. npm test         │  <- stops here if tests fail
 │ 2. docker build     │
 │ 3. push to GHCR     │
 │ 4. SSH deploy       │
 └─────────┬──────────┘
           │ SSH
           ▼
 ┌────────────────────┐      port 80 (public)
 │ AWS EC2 (Ubuntu)    │◄──────────────────────  users
 │  docker run         │
 │  deployready-app    │
 │  (port 3000 inside) │
 └────────────────────┘
```

- **App**: `app/` — Express API with `/health`, `/metrics`, `POST /data`.
- **Container**: `Dockerfile` builds a small `node:20-alpine` image, runs as
  a non-root user, listens on the port given by `PORT`.
- **Local dev**: `docker-compose.yml` + `.env` bring the app up with one
  command.
- **CI/CD**: `.github/workflows/deploy.yml` — test, build & tag with the
  commit SHA, push to GitHub Container Registry, then SSH into the EC2 box
  to pull and restart the container.
- **Cloud**: single AWS EC2 `t2.micro` (free tier), security group open on
  80 (public) and 22 (my IP only). Full walkthrough in `DEPLOYMENT.md`.

## Running locally without Docker

```bash
cd app
npm install
npm start
# http://localhost:3000/health
```

Run the tests:

```bash
cd app
npm test
```

## Running locally with Docker

```bash
cp .env.example .env
docker compose up --build
# http://localhost:3000/health
```

## Deploying

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step AWS setup,
and `.github/workflows/deploy.yml` for the pipeline itself. Required GitHub
repository secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`,
`GHCR_TOKEN`.

## Decisions made

- **GitHub Container Registry** over ECR/GCR/ACR — no extra cloud IAM setup
  needed, works with the `GITHUB_TOKEN` that Actions already provides for
  the push step.
- **Deploy via SSH + `docker run`** rather than an orchestrator — matches
  the scale of a single small service and keeps the AWS side to "one VM,
  one security group," which is easiest to reason about for a first
  DevOps project.
- **Node's built-in test runner** (`node --test`) instead of Jest/Mocha —
  zero extra dependencies, ships with Node 18+.
