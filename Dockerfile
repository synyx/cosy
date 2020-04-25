# first stage
# build application sources
FROM node:12-stretch as builder

RUN mkdir -p /app/node_modules && chown -R node:node /app
USER node

WORKDIR /app

# copy files required for the build
COPY --chown=node:node . ./

RUN npm ci
RUN npm run build

# ========================================================
# Final production image
# only contains prod app required sources and dependencies
FROM node:12-stretch

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

RUN mkdir -p /app/node_modules && chown -R node:node /app
USER node

WORKDIR /app

COPY --from=builder /app/out ./out
COPY --from=builder /app/src ./src
COPY --from=builder /app/static ./static
COPY --from=builder /app/package*.json ./

# install only production dependencies
RUN npm ci --only=production

CMD [ "node", "src/server/index.js" ]
