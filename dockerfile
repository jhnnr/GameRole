FROM node:18-alpine3.17

COPY package.json /app/
COPY / /app/
WORKDIR  /app
RUN npm install
EXPOSE 8080
CMD ["node", "index.js"]

