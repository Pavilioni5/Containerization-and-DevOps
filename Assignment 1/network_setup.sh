#!/bin/bash

NETWORK_NAME=student_macvlan
SUBNET=192.168.1.0/24
GATEWAY=192.168.1.1
PARENT_IFACE=eth0

docker network create -d macvlan \
--subnet=$SUBNET \
--gateway=$GATEWAY \
-o parent=$PARENT_IFACE \
$NETWORK_NAME
