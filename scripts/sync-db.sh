#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/root/deccan-throwdown}"
SSH_IDENTITY_FILE="${SSH_IDENTITY_FILE:-${HOME}/.ssh/id_ed25519}"
LOCAL_DB="${LOCAL_DB:-${REPO_ROOT}/backend/database.db}"
REMOTE_DB="${REMOTE_DB:-${DEPLOY_PATH}/backend/database.db}"
DRY_RUN=false
ASSUME_YES=false
DIRECTION=""

usage() {
    cat <<EOF
Sync backend/database.db between local and a remote droplet.

Usage:
  $0 push [options] [user@]host   Copy local database.db to remote
  $0 pull [options] [user@]host   Copy remote database.db to local

Arguments:
  [user@]host    SSH target (or set DEPLOY_HOST)

Environment variables:
  DEPLOY_HOST         Droplet hostname or IP
  DEPLOY_USER         SSH user (default: root)
  DEPLOY_PATH         Remote app directory (default: /root/deccan-throwdown)
  SSH_IDENTITY_FILE   SSH private key (default: ~/.ssh/id_ed25519)
  LOCAL_DB            Local database path (default: backend/database.db)
  REMOTE_DB           Remote database path (default: \${DEPLOY_PATH}/backend/database.db)

Options:
  --dry-run         Print commands without executing them
  -y, --yes         Skip confirmation prompt
  -h, --help        Show this help message

Examples:
  $0 push dt.cfgames.site
  $0 pull root@dt.cfgames.site
  $0 push -y dt.cfgames.site

Notes:
  - Creates a timestamped backup of the destination file before overwriting it.
  - push overwrites production data on the droplet.
  - pull overwrites your local database.db.
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
SSH_CMD=(ssh)
RSYNC_SSH="ssh"
RSYNC_FLAGS=(-avz)

parse_args() {
    if [[ $# -lt 1 ]]; then
        usage
        exit 1
    fi

    case "$1" in
        push|pull)
            DIRECTION="$1"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Error: first argument must be 'push' or 'pull'." >&2
            usage
            exit 1
            ;;
    esac

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                usage
                exit 0
                ;;
            --dry-run)
                DRY_RUN=true
                RSYNC_FLAGS+=(-n)
                shift
                ;;
            -y|--yes)
                ASSUME_YES=true
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
        echo "Error: SSH target is required." >&2
        usage
        exit 1
    fi

    if [[ "${SSH_TARGET}" != *@* ]]; then
        SSH_TARGET="${DEPLOY_USER}@${SSH_TARGET}"
    fi

    if [[ -f "${SSH_IDENTITY_FILE}" ]]; then
        SSH_CMD=(ssh -i "${SSH_IDENTITY_FILE}")
        RSYNC_SSH="ssh -i ${SSH_IDENTITY_FILE}"
    fi
}

confirm_sync() {
    local source_path="$1"
    local dest_path="$2"

    if [[ "${ASSUME_YES}" == true || "${DRY_RUN}" == true ]]; then
        return 0
    fi

    echo
    echo "This will overwrite the destination database:"
    echo "  from: ${source_path}"
    echo "  to:   ${dest_path}"
    read -r -p "Continue? [y/N] " reply
    if [[ ! "${reply}" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
}

backup_local_db() {
    if [[ ! -f "${LOCAL_DB}" ]]; then
        return 0
    fi

    local backup_path="${LOCAL_DB%.db}-backup-$(date +%F-%H%M%S).db"
    log "Backing up local database to ${backup_path}"
    run cp "${LOCAL_DB}" "${backup_path}"
}

backup_remote_db() {
    local remote_cmd
    remote_cmd=$(cat <<EOF
set -euo pipefail
if [[ -f '${REMOTE_DB}' ]]; then
    backup_path='${REMOTE_DB%.db}-backup-'"\$(date +%F-%H%M%S)"'.db'
    cp '${REMOTE_DB}' "\${backup_path}"
    echo "\${backup_path}"
fi
EOF
)

    if [[ "${DRY_RUN}" == true ]]; then
        echo "[dry-run] ssh ${SSH_TARGET} backup remote db if it exists"
    else
        local backup_path
        backup_path="$("${SSH_CMD[@]}" "${SSH_TARGET}" "${remote_cmd}" || true)"
        if [[ -n "${backup_path}" ]]; then
            log "Backed up remote database to ${backup_path}"
        fi
    fi
}

sync_push() {
    if [[ ! -f "${LOCAL_DB}" ]]; then
        echo "Error: local database not found at ${LOCAL_DB}" >&2
        exit 1
    fi

    confirm_sync "${LOCAL_DB}" "${SSH_TARGET}:${REMOTE_DB}"
    backup_remote_db

    log "Pushing ${LOCAL_DB} to ${SSH_TARGET}:${REMOTE_DB}"
    run rsync "${RSYNC_FLAGS[@]}" -e "${RSYNC_SSH}" \
        "${LOCAL_DB}" \
        "${SSH_TARGET}:${REMOTE_DB}"
}

sync_pull() {
    confirm_sync "${SSH_TARGET}:${REMOTE_DB}" "${LOCAL_DB}"
    backup_local_db

    log "Pulling ${SSH_TARGET}:${REMOTE_DB} to ${LOCAL_DB}"
    run mkdir -p "$(dirname "${LOCAL_DB}")"
    run rsync "${RSYNC_FLAGS[@]}" -e "${RSYNC_SSH}" \
        "${SSH_TARGET}:${REMOTE_DB}" \
        "${LOCAL_DB}"
}

main() {
    parse_args "$@"
    resolve_ssh_target

    require_command rsync
    require_command ssh

    log "Direction: ${DIRECTION}"
    log "SSH target: ${SSH_TARGET}"
    log "Local db: ${LOCAL_DB}"
    log "Remote db: ${REMOTE_DB}"

    case "${DIRECTION}" in
        push)
            sync_push
            ;;
        pull)
            sync_pull
            ;;
    esac

    log "Database sync complete"
}

main "$@"
