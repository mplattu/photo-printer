.PHONY: lint-js
lint-js:
	npx eslint "src/js/**"

build/server.php: src/backend/server.php
	cp src/backend/server.php build/

build/index.html: src/html/*
	if [ ! -d build/ ]; then mkdir build/; fi
	cp src/html/* build/

build/index.js: lint-js src/js/*
	if [ ! -d build/ ]; then mkdir build/; fi
	-rm build/index.js*
	node ./esbuild.mjs

start:
	php -S localhost:8080 -t build/

.PHONY: build
build: build/index.html build/index.js build/server.php

:PHONY: publish
publish:
	ssh septit.net rm -fR stadi.ninja/kamera/
	ssh septit.net mkdir stadi.ninja/kamera/
	scp build/* septit.net:stadi.ninja/kamera/
