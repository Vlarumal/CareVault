#!/bin/bash

echo "Install dependencies"
npm install

echo "Build UI"
npm run build:ui

echo "Build script"
npm run tsc