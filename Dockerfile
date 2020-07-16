FROM node:12-alpine
WORKDIR /ISS
COPY . .
RUN npm install --production
CMD ["node", "backend/server.js"]