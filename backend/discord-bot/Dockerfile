FROM node:18-alpine

WORKDIR /app

COPY package.json .
RUN npm ci --only=production

COPY bot.js .

USER 1000:1000

CMD ["node", "bot.js"]
