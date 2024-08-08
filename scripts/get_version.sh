#!/usr/bin/env bash

# Get VERSION from settings.py
grep -Eo -m 1 'VERSION\s+= .*([0-9]+)\.[0-9]+\.[0-9]+.*' main/settings.py |
	head -1 |
	grep -Eo "[0-9]+\.[0-9]+\.[0-9]+"
