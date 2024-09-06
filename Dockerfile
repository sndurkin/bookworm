FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN rm -f database.sqlite
RUN npm run build

EXPOSE 3015
CMD ["npm run serve"]
