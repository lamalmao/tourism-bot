FROM node:18

ENV TZ=Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /usr/src/bot


COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn run build

EXPOSE 80
EXPOSE 8080
EXPOSE 443
EXPOSE 5222
EXPOSE 3000
EXPOSE 3001

CMD [ "yarn", "start" ]