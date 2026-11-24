FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

COPY . .

EXPOSE 8001

CMD ["npm", "run", "dev"]
