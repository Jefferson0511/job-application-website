# syntax=docker/dockerfile:1

# ---- deps ----------------------------------------------------------------
# Full dependency tree, used only to compile. Kept as its own layer so that
# editing source code does not re-run npm ci.
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ---------------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV TRANSFORMERS_CACHE_DIR=/app/.model-cache

# onnxruntime-node's prebuilt binary links against the OpenMP runtime, which
# the slim image does not ship. Without it the prefetch below fails to load
# the model and silently falls back to downloading at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Bake the embedding model into the image so the container starts offline and
# the first search does not pay a download. The directory is created first so
# that a prefetch failure degrades to "downloads at runtime" rather than
# breaking the COPY in the runtime stage.
RUN mkdir -p /app/.model-cache && node scripts/prefetch-model.js

# ---- production dependencies --------------------------------------------
# Resolved separately from the build tree so devDependencies (nest CLI,
# typescript, jest) never reach the runtime image.
FROM node:20-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime -------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3002 \
    TRANSFORMERS_CACHE_DIR=/app/.model-cache

# Required by onnxruntime-node, which runs the embedding model.
RUN apt-get update \
  && apt-get install -y --no-install-recommends libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.model-cache ./.model-cache
COPY package.json ./

# The node image ships an unprivileged `node` user; use it rather than root.
RUN chown -R node:node /app
USER node

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3002)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
