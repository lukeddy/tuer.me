#!/bin/sh

cd "/home/tuer2.0/"
forever stop app.js
forever start app.js
