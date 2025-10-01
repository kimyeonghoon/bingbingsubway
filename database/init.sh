#!/bin/bash
mysql --default-character-set=utf8mb4 -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < /docker-entrypoint-initdb.d/01-schema.sql
mysql --default-character-set=utf8mb4 -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < /docker-entrypoint-initdb.d/02-seeds.sql
