FROM postgres:9.6.4-alpine

RUN apk add --update bash curl nodejs

# Install Consul
# Releases at https://releases.hashicorp.com/consul
RUN set -ex \
    && export CONSUL_VERSION=0.7.5 \
    && export CONSUL_CHECKSUM=40ce7175535551882ecdff21fdd276cef6eaab96be8a8260e0599fadb6f1f5b8 \
    && curl --retry 7 --fail -vo /tmp/consul.zip "https://releases.hashicorp.com/consul/${CONSUL_VERSION}/consul_${CONSUL_VERSION}_linux_amd64.zip" \
    && echo "${CONSUL_CHECKSUM}  /tmp/consul.zip" | sha256sum -c \
    && unzip /tmp/consul -d /usr/local/bin \
    && rm /tmp/consul.zip \
    # Create empty directories for Consul config and data \
    && mkdir -p /etc/consul \
    && mkdir -p /var/lib/consul \
    && mkdir /config

# Install Consul template
# Releases at https://releases.hashicorp.com/consul-template/
RUN set -ex \
    && export CONSUL_TEMPLATE_VERSION=0.19.0 \
    && export CONSUL_TEMPLATE_CHECKSUM=31dda6ebc7bd7712598c6ac0337ce8fd8c533229887bd58e825757af879c5f9f \
    && curl --retry 7 --fail -Lso /tmp/consul-template.zip "https://releases.hashicorp.com/consul-template/${CONSUL_TEMPLATE_VERSION}/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip" \
    && echo "${CONSUL_TEMPLATE_CHECKSUM}  /tmp/consul-template.zip" | sha256sum -c \
    && unzip /tmp/consul-template.zip -d /usr/local/bin \
    && rm /tmp/consul-template.zip

# Add Containerpilot and set its configuration
COPY etc/containerpilot.json5 /etc
ENV CONTAINERPILOT /etc/containerpilot.json5
ENV CONTAINERPILOT_VERSION 3.3.3

RUN export CONTAINERPILOT_CHECKSUM=8d680939a8a5c8b27e764d55a78f5e3ae7b42ef4 \
    && export archive=containerpilot-${CONTAINERPILOT_VERSION}.tar.gz \
    && curl -Lso /tmp/${archive} \
         "https://github.com/joyent/containerpilot/releases/download/${CONTAINERPILOT_VERSION}/${archive}" \
    && echo "${CONTAINERPILOT_CHECKSUM}  /tmp/${archive}" | sha1sum -c \
    && tar zxf /tmp/${archive} -C /usr/local/bin \
    && rm /tmp/${archive}

# Add Postgres templates
COPY etc/pg_hba.conf /etc
COPY etc/postgresql.conf.ctmpl /etc
COPY etc/recovery.conf.ctmpl /etc

# Set up Node.js app
COPY bin /bin
RUN cd /bin && npm install && npm run lint

ENTRYPOINT []
CMD ["/usr/local/bin/containerpilot"]
