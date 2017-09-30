FROM node:8.6.0

RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app

#COPY package.json package-lock.json $HOME/bookliner/
COPY package.json yarn.lock $HOME/bookliner/

RUN chown -R app:app $HOME/*

USER app

WORKDIR $HOME/bookliner

RUN yarn install

USER root

COPY . $HOME/bookliner

RUN chown -R app:app $HOME/*

USER app

CMD ["node", "index.js"]
