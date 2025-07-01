#!/bin/bash
git pull origin develop
docker-compose down
docker-compose up -d --build
