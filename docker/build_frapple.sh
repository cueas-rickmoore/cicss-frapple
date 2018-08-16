#!/bin/bash
docker build -t cicca/frapple:$1 -f ./DockerFiles/Dockerfile_$1.frapple .
