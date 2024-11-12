FROM dirigiblelabs/dirigible:latest

COPY BikePark target/dirigible/repository/root/registry/public/BikePark

ENV DIRIGIBLE_HOME_URL=/services/web/BikePark/frontend/index.html

EXPOSE 8080
