#!/bin/bash

#http-server ./app -a localhost -p 8000 -c-1 -P 'http://localhost:8000?'
#http-server ./app -a localhost -p 8000 -c-1
http-server ./app -a 192.168.31.161 -p 8080 -c-1
#http-server ./app -a '192.168.0.7' -p 8000 -c-1

