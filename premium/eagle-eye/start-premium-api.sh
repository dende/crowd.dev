#!/usr/bin/env bash

CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
$CLI_HOME/venv/bin/python -u -m flask --app server --debug run --host=0.0.0.0
