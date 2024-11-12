# Docker descriptor for online_bank
# License - http://www.eclipse.org/legal/epl-v20.html

FROM ghcr.io/codbex/codbex-gaia:0.26.0

COPY BikePark target/dirigible/repository/root/registry/public/BikePark

ENV DIRIGIBLE_HOME_URL=/services/web/BikePark/frontend/index.html

ENV DIRIGIBLE_MULTI_TENANT_MODE=false

EXPOSE 80
