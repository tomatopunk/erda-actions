FROM alpine

# sed -i "s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g" /etc/apk/repositories \
RUN apk add --no-cache curl \
      && apk add --no-cache bash

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

RUN . $HOME/.nvm/nvm.sh \
      && nvm install v12.22.5 \
      && nvm install v14.19.0 \
      && nvm alias default v14.19.0 \
      && nvm use default

COPY run /opt/action/run
RUN chmod 777 /opt/action/run

