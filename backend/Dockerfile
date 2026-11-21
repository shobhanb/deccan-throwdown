FROM python:3.12-slim-trixie

COPY --from=ghcr.io/astral-sh/uv:0.13.6 /uv /uvx /bin/

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_DEV=1 \
    PATH="/app/.venv/bin:$PATH"

# Install dependencies first for better layer caching.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked \
    && useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

EXPOSE 8000

# Start as root so entrypoint can chown the bind-mounted SQLite file, then drop to appuser.
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["fastapi", "run", "app/main.py", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--root-path", "/api", \
     "--workers", "1", \
     "--proxy-headers"]
