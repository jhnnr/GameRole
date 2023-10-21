FROM node:21-alpine3.17

COPY package.json /app/
COPY / /app/
WORKDIR  /app
RUN npm install

CMD ["node", "index.js"]

