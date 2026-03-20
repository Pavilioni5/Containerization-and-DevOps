FROM postgres:16-alpine

ENV POSTGRES_DB=studentdb
ENV POSTGRES_USER=appuser
ENV POSTGRES_PASSWORD=strongpassword

COPY init.sql /docker-entrypoint-initdb.d/
