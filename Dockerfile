FROM node:20-slim

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

# Copy app source code to the working dir.
COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/web.js"]
