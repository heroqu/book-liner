FROM node:8.6.0

RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app

#COPY package.json package-lock.json $HOME/cstore/
COPY package.json yarn.lock $HOME/cstore/

RUN chown -R app:app $HOME/*

USER app

WORKDIR $HOME/cstore

RUN yarn install

USER root

COPY . $HOME/cstore

RUN chown -R app:app $HOME/*

USER app

CMD ["node", "index.js"]
