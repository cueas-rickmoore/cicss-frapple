#!/bin/bash
docker run -dit --name frapple$2 -v /home/web/nrcc_data/cicca:/app_data:ro -p 20006:20006 cicca/frapple:$1
sleep 10s
docker exec -d frapple$2 /opt/tool_pkg/frapple/blocking/run_server.py -p
