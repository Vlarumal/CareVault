#!/bin/bash

REDIS_CONTAINER="patientsapp-redis-1"

DEFAULT_IP="::ffff:172.18.0.1"

IP=${1:-$DEFAULT_IP}

echo "Unblocking IP: $IP"

docker exec $REDIS_CONTAINER redis-cli DEL "blocked:ip:$IP"

docker exec $REDIS_CONTAINER redis-cli DEL "attempts:ip:$IP"

echo "IP $IP has been unblocked and attempts counter reset"