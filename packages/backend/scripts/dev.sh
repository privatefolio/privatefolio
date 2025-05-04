#!/bin/bash

concurrently "yarn build:watch" "yarn start:watch" \
--kill-others \
--prefix "{command} {time}" \
--prefix-colors "cyan,yellow" \
--prefix-length 30 \
--timestampFormat "[HH:mm:ss]"
