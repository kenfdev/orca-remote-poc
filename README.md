# Orca Hono Todo PoC

A small TypeScript Todo API using [Hono](https://hono.dev/) and PostgreSQL. The repository is designed to run inside a Docker development container that Orca can connect to over SSH without publishing container port 22 or the application port to the host.

## File Tree

```text
.
├── .devcontainer/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── sshd_config
│   ├── claude/.gitkeep
│   ├── codex/.gitkeep
│   └── ssh/.gitkeep
├── src/
│   ├── db.ts
│   └── index.ts
├── scripts/
│   ├── migrate.ts
│   └── seed.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

## Start the Environment

```bash
docker compose up -d --build
```

Enter the container manually:

```bash
docker compose exec app bash
```

Run the app inside the container:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The Hono server binds to `0.0.0.0:3000` inside the container. The port is not published to the host by default; use Orca SSH port forwarding to reach it.

## API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/todos
curl -X POST http://localhost:3000/todos \
  -H 'content-type: application/json' \
  -d '{"title":"Try Orca port forwarding"}'
curl -X PATCH http://localhost:3000/todos/1 \
  -H 'content-type: application/json' \
  -d '{"completed":true}'
curl -X DELETE http://localhost:3000/todos/1
```

## Orca SSH Setup

The app container has a stable name, `hono-todo-app`, and labels for discovery:

```yaml
orca.ssh: "true"
orca.user: vscode
orca.workspace: /workspace
```

SSH is configured for inetd mode. Orca can connect by asking Docker to run sshd on stdin/stdout:

```bash
docker exec -i hono-todo-app /usr/sbin/sshd -i
```

This avoids publishing port 22. SFTP is enabled for file operations.

Add your public key to:

```text
.devcontainer/ssh/authorized_keys
```

The directory is mounted to `/home/vscode/.ssh` and permissions are normalized when the container starts.

### Local Docker SSH Config

```sshconfig
Host orca-hono-todo
  HostName hono-todo-app
  User vscode
  ProxyCommand docker exec -i hono-todo-app /usr/sbin/sshd -i
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

### Remote Docker Host SSH Config

```sshconfig
Host orca-hono-todo-remote
  HostName hono-todo-app
  User vscode
  ProxyCommand ssh my-remote-docker-host docker exec -i hono-todo-app /usr/sbin/sshd -i
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

## Orca Workflow

1. Start Docker Compose:

   ```bash
   docker compose up -d --build
   ```

2. Add or import the SSH target in Orca.
3. Add the remote repo path `/workspace`.
4. Open a terminal in Orca.
5. Run:

   ```bash
   pnpm install
   pnpm db:migrate
   pnpm dev
   ```

6. Use Orca's Ports panel to forward the detected Hono dev server port.
7. Open the forwarded port in Orca's browser/design mode.
8. Run Claude Code or Codex inside Orca terminals. Their auth and config persist through the mounted `.devcontainer/claude` and `.devcontainer/codex` directories.

## Package Scripts

```bash
pnpm dev        # run the Hono server in watch mode
pnpm build      # compile TypeScript to dist/
pnpm start      # run compiled JavaScript
pnpm db:migrate # create the todos table and index
pnpm db:seed    # insert sample todos
pnpm typecheck  # run TypeScript checks without emitting files
```
