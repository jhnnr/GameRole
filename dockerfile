FROM node:18-alpine3.17

# Define build arguments
ARG DISCORD_TOKEN
ARG MONGODB_PWD

ENV DISCORD_TOKEN=${DISCORD_TOKEN}
ENV MONGODB_PWD=${MONGODB_PWD}

COPY package.json /app/
COPY / /app/
WORKDIR  /app
RUN npm install
EXPOSE 80
CMD ["node", "index.js"]

