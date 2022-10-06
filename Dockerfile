FROM node:16.16.0

RUN npm install --global nodemon

WORKDIR /usr/src/smart-brain-api

COPY ./ ./

RUN npm install

CMD ["/bin/bash"]