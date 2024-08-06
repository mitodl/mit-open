#!/usr/bin/env bash

# Get VERSION from settings.py
grep -Eo -m 1 'VERSION\s+= .*(\d+)\.\d+\.\d+.*' main/settings.py |
	head -1 |
	grep -Eo "\d+\.\d+\.\d+"
