FROM quay.io/keycloak/keycloak:latest AS builder

WORKDIR /opt/keycloak

RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:latest
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Enable http support
ENV KC_HTTP_ENABLED=true
ENV KC_HTTP_PORT=8081

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure a database vendor
ENV KC_HOSTNAME=localhost

ENV KC_DB=postgres
ENV KC_DB_URL_HOST=postgresql.rtech.com
ENV KC_DB_URL_PORT=5432
ENV KC_DB_URL_DATABASE=security
ENV KC_DB_SCHEMA=keycloak
ENV KC_DB_USERNAME=postgres

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]