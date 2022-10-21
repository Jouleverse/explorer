#!/bin/bash

http-server ./app -a localhost -p 8000 -c-1 -P 'http://localhost:8000?'
