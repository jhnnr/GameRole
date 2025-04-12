# Use Node.js 18 Alpine image
FROM node:18-alpine

# Install Python, make, g++, and pip for building native modules
RUN apk add --no-cache python3 py3-pip make g++

# Define build arguments
ARG DISCORD_TOKEN
ARG MONGODB_PWD

# Set environment variables
ENV DISCORD_TOKEN=${DISCORD_TOKEN}
ENV MONGODB_PWD=${MONGODB_PWD}

# Copy application files
COPY package.json /app/
COPY / /app/
WORKDIR /app

# Install dependencies
RUN npm install

# Expose port 80
EXPOSE 80

# Start the application
CMD ["node", "index.js"]
