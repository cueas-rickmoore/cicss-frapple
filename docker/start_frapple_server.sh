#!/bin/bash
docker exec -d frapple$1 /opt/tool_pkg/frapple/blocking/run_server.py -p
