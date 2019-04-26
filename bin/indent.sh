#!/bin/bash
cd test
FILES=*.coffee
for f in $FILES; do
  unexpand -t 2 $f | expand -t 4 > coffee/$f
done