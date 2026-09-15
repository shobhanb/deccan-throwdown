#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/root/deccan-throwdown}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SKIP_BUILD=false
SKIP_FRONTEND=false
DRY_RUN=false

usage() {
    cat <<EOF
Deploy Deccan Throwdown to a DigitalOcean droplet (manual Phase 1).

Usage:
  $0 [options] [user@]host

Arguments:
  [user@]host    SSH target (overrides DEPLOY_HOST / DEPLOY_USER)

Environment variables:
  DEPLOY_HOST    Droplet hostname or IP (alternative to positional argument)
  DEPLOY_USER    SSH user (default: root)
  DEPLOY_PATH    Remote app directory (default: /root/deccan-throwdown)
  DEPLOY_BRANCH  Git branch to deploy (default: main)

Options:
  --skip-build      Skip local Angular build (use existing frontend/www)
  --skip-frontend   Skip rsync of frontend/www (backend/config only)
  --dry-run         Print commands without executing them
  -h, --help        Show this help message

Examples:
  $0 root@203.0.113.10
  DEPLOY_BRANCH=main $0 dt.cfgames.site
  $0 --skip-frontend root@203.0.113.10

Notes:
  - Pulls latest code on the droplet, builds frontend locally, rsyncs
    frontend/www, then runs docker compose up -d --build.
  - Clones the repo on first deploy if ${DEPLOY_PATH} does not exist yet.
  - Production database.db is never copied from local to the droplet.
EOF
}

log() {
    echo "==> $*"
}

run() {
    if [[ "${DRY_RUN}" == true ]]; then
        echo "[dry-run] $*"
    else
        "$@"
    fi
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: required command not found: $1" >&2
        exit 1
    fi
}

SSH_TARGET=""

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                usage
                exit 0
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-frontend)
                SKIP_FRONTEND=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -*)
                echo "Error: unknown option: $1" >&2
                usage
                exit 1
                ;;
            *)
                if [[ -n "${SSH_TARGET}" ]]; then
                    echo "Error: unexpected argument: $1" >&2
                    usage
                    exit 1
                fi
                SSH_TARGET="$1"
                shift
                ;;
        esac
    done
}

resolve_ssh_target() {
    if [[ -z "${SSH_TARGET}" && -n "${DEPLOY_HOST:-}" ]]; then
        SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
    fi

    if [[ -z "${SSH_TARGET}" ]]; then
        echo "Error: deploy target is required." >&2
        usage
        exit 1
    fi

    if [[ "${SSH_TARGET}" != *@* ]]; then
        SSH_TARGET="${DEPLOY_USER}@${SSH_TARGET}"
    fi
}

build_frontend() {
    log "Building Angular frontend for production"
    cd "${REPO_ROOT}/frontend"

    if [[ ! -d node_modules ]]; then
        log "Installing frontend dependencies"
        run npm ci
    fi

    run npm run build

    if [[ ! -f www/index.html ]]; then
        echo "Error: frontend build failed; ${REPO_ROOT}/frontend/www/index.html not found" >&2
        exit 1
    fi
}

run_remote() {
    local remote_cmd="$1"

    if [[ "${DRY_RUN}" == true ]]; then
        echo "[dry-run] ssh ${SSH_TARGET} <<'REMOTE'"
        echo "${remote_cmd}"
        echo "REMOTE"
    else
        ssh "${SSH_TARGET}" "${remote_cmd}"
    fi
}

prepare_remote() {
    local repo_url
    repo_url="$(git -C "${REPO_ROOT}" remote get-url origin)"

    log "Ensuring repo exists and is up to date on ${SSH_TARGET}"

    local remote_cmd
    remote_cmd=$(cat <<EOF
set -euo pipefail
if [[ ! -d '${DEPLOY_PATH}/.git' ]]; then
    mkdir -p '$(dirname "${DEPLOY_PATH}")'
    git clone '${repo_url}' '${DEPLOY_PATH}'
fi
cd '${DEPLOY_PATH}'
git fetch origin
git checkout '${DEPLOY_BRANCH}'
git pull --ff-only origin '${DEPLOY_BRANCH}'
mkdir -p '${DEPLOY_PATH}/frontend/www'
EOF
)

    run_remote "${remote_cmd}"
}

sync_frontend() {
    log "Syncing frontend/www to ${SSH_TARGET}:${DEPLOY_PATH}/frontend/www/"
    run rsync -avz --delete \
        "${REPO_ROOT}/frontend/www/" \
        "${SSH_TARGET}:${DEPLOY_PATH}/frontend/www/"
}

restart_containers() {
    log "Restarting containers on ${SSH_TARGET}"

    local remote_cmd
    remote_cmd=$(cat <<EOF
set -euo pipefail
cd '${DEPLOY_PATH}'
docker compose up -d --build
docker compose ps
EOF
)

    run_remote "${remote_cmd}"
}

main() {
    parse_args "$@"
    resolve_ssh_target

    require_command ssh
    require_command rsync
    require_command npm

    log "Deploy target: ${SSH_TARGET}"
    log "Remote path: ${DEPLOY_PATH}"
    log "Branch: ${DEPLOY_BRANCH}"

    prepare_remote

    if [[ "${SKIP_FRONTEND}" == false ]]; then
        if [[ "${SKIP_BUILD}" == false ]]; then
            build_frontend
        elif [[ ! -f "${REPO_ROOT}/frontend/www/index.html" ]]; then
            echo "Error: --skip-build was set but frontend/www is missing. Run a build first." >&2
            exit 1
        fi

        sync_frontend
    else
        log "Skipping frontend build and rsync"
    fi

    restart_containers

    log "Deploy complete"
    log "Production database was not modified."
}

main "$@"
