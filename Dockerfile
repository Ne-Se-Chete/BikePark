FROM dirigiblelabs/dirigible:latest

COPY bike-park target/dirigible/repository/root/registry/public/bike-park

ENV DIRIGIBLE_HOME_URL=/services/web/bike-park/frontend/index.html

ENV DIRIGIBLE_MULTI_TENANT_MODE=false

EXPOSE 8080
