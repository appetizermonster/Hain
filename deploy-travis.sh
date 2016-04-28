#!/bin/sh

set -e

node_modules/.bin/gulp build-debian
mv out/installers/*.deb hain-${TRAVIS_TAG}.deb
