FROM node:12-stretch

RUN mkdir -p /app/node_modules && chown -R node:node /app
USER node

WORKDIR /app

# copy files required for the build
COPY --chown=node:node . ./

RUN npm ci
RUN npm run build

# delete devDependencies
RUN npm prune --production

# NODE_ENV=production must not be set before the `npm ci` task
# otherwise only production dependencies are installed which are
# needed for the `npm run build` task ;-)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD [ "node", "src/server/index.js" ]
