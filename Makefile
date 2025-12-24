composer.phar:
	php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
	php -r "if (hash_file('sha384', 'composer-setup.php') === 'c8b085408188070d5f52bcfe4ecfbee5f727afa458b2573b8eaaf77b3419b0bf2768dc67c86944da1544f06fa544fd47') { echo 'Installer verified'.PHP_EOL; } else { echo 'Installer corrupt'.PHP_EOL; unlink('composer-setup.php'); exit(1); }"
	php composer-setup.php
	php -r "unlink('composer-setup.php');"

.PHONY: lint-js
lint-js:
	npx eslint "src/js/**"

build/vendor/autoload.php: composer.phar composer.lock
	if [ -d build/vendor/ ]; then rm -fR build/vendor/; fi
	./composer.phar install

build/server.php: build/vendor/autoload.php src/backend/server.php
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
