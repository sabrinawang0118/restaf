#!/usr/bin/env bash
echo "Starting app"
set -x
exec npx jest -- $TESTS
