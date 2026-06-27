#!/usr/bin/env bash
set -euo pipefail

USERNAME=vscode

mkdir -p "/home/${USERNAME}/.ssh" "/home/${USERNAME}/.claude" "/home/${USERNAME}/.codex"

# These directories are bind-mounted from the host. Their ownership can drift
# between rebuilds, so normalize it before Orca starts SSH/SFTP sessions.
chown -R "${USERNAME}:${USERNAME}" "/home/${USERNAME}/.ssh" "/home/${USERNAME}/.claude" "/home/${USERNAME}/.codex" /workspace
chmod 700 "/home/${USERNAME}/.ssh"
if [ -f "/home/${USERNAME}/.ssh/authorized_keys" ]; then
  chmod 600 "/home/${USERNAME}/.ssh/authorized_keys"
fi

exec "$@"
