#!/bin/bash

rocks list host | grep compute | cut -d" " -f1 | sed 's/.$//' | shuf | head -n $1 > storeHostInfo