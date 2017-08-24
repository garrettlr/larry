FROM node:8

# Create app directory
WORKDIR /usr/src/app
VOLUME /usr/src/app

EXPOSE 80
EXPOSE 40801
CMD [ "npx", "parcel", "-d", "/usr/dist", "--port", "80", "--hmr-port", "40801", "/usr/src/app/src/app/index.html"]