#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")"
flyway -configFiles="$(pwd)/flyway.conf" info
