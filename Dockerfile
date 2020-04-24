FROM node:12-stretch

# RUN apk add --no-cache cairo pango

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

ENV PORT=8080
ENV NODE_ENV=production

WORKDIR /home/node/app
COPY package*.json ./

USER node

# install only production dependencies
RUN npm ci --only=production

# copy app files
COPY --chown=node:node . .

EXPOSE 8080

CMD [ "node", "src/server/index.js" ]
