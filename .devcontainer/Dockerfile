FROM node:22-bookworm

ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=1000

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    ca-certificates \
    curl \
    git \
    openssh-server \
    ripgrep \
    sudo \
  && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
  if getent group "${USER_GID}" >/dev/null; then \
    EXISTING_GROUP="$(getent group "${USER_GID}" | cut -d: -f1)"; \
    if [ "${EXISTING_GROUP}" != "${USERNAME}" ]; then groupmod --new-name "${USERNAME}" "${EXISTING_GROUP}"; fi; \
  else \
    groupadd --gid "${USER_GID}" "${USERNAME}"; \
  fi; \
  if getent passwd "${USER_UID}" >/dev/null; then \
    EXISTING_USER="$(getent passwd "${USER_UID}" | cut -d: -f1)"; \
    if [ "${EXISTING_USER}" != "${USERNAME}" ]; then usermod --login "${USERNAME}" --home "/home/${USERNAME}" --move-home "${EXISTING_USER}"; fi; \
    usermod --gid "${USER_GID}" --shell /bin/bash "${USERNAME}"; \
  else \
    useradd --uid "${USER_UID}" --gid "${USER_GID}" -m -s /bin/bash "${USERNAME}"; \
  fi; \
  mkdir -p "/home/${USERNAME}" \
  && echo "${USERNAME}:vscode" | chpasswd \
  && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/${USERNAME}" \
  && chmod 0440 "/etc/sudoers.d/${USERNAME}"

RUN corepack enable \
  && corepack prepare pnpm@10.12.4 --activate \
  && npm install -g @anthropic-ai/claude-code @openai/codex

RUN mkdir -p /workspace /run/sshd /home/${USERNAME}/.ssh /home/${USERNAME}/.claude /home/${USERNAME}/.codex \
  && chown -R "${USERNAME}:${USERNAME}" /workspace /home/${USERNAME}

COPY .devcontainer/sshd_config /etc/ssh/sshd_config
COPY .devcontainer/entrypoint.sh /usr/local/bin/devcontainer-entrypoint

RUN chmod +x /usr/local/bin/devcontainer-entrypoint

WORKDIR /workspace
ENTRYPOINT ["devcontainer-entrypoint"]
