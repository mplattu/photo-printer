composer.phar:
	php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
	php -r "if (hash_file('sha384', 'composer-setup.php') === 'c8b085408188070d5f52bcfe4ecfbee5f727afa458b2573b8eaaf77b3419b0bf2768dc67c86944da1544f06fa544fd47') { echo 'Installer verified'.PHP_EOL; } else { echo 'Installer corrupt'.PHP_EOL; unlink('composer-setup.php'); exit(1); }"
	php composer-setup.php
	php -r "unlink('composer-setup.php');"

.PHONY: lint-js
lint-js:
	npx eslint "src/js/**"

build/vendor/autoload.php: composer.phar composer.lock composer.json
	if [ -d build/vendor/ ]; then rm -fR build/vendor/; fi
	./composer.phar install

build/settings.php:
	if [ ! -f build/settings.php ]; then cp src/backend/settings-template.php build/settings.php; fi

build/server.php: build/vendor/autoload.php src/backend/server.php build/settings.php
	cp src/backend/server.php build/

.PHONY: html
html: src/html/*
	if [ ! -d build/ ]; then mkdir build/; fi
	cp src/html/* build/

build/index.js: lint-js src/js/* src/css/*
	if [ ! -d build/ ]; then mkdir build/; fi
	-rm build/index.js*
	node ./esbuild.mjs

start:
	php -S localhost:8080 -t build/

.PHONY: build
build: html build/index.js build/server.php

include settings.mk

:PHONY: publish
publish:
	if [ -f photo-printer-app.zip ]; then rm photo-printer-app.zip; fi
	cd build; zip -ry9 ../photo-printer-app.zip * -x settings.php
	scp photo-printer-app.zip $(PUBLISH_REMOTE_SERVER):$(PUBLISH_COPY_ZIP_TO)/
	ssh $(PUBLISH_REMOTE_SERVER) rm -f $(PUBLISH_PREV_ZIP_TO)
	ssh $(PUBLISH_REMOTE_SERVER) "cd $(PUBLISH_TARGET_DIR); zip -ry9 $(PUBLISH_PREV_ZIP_TO) *"
	ssh $(PUBLISH_REMOTE_SERVER) rm -fR $(PUBLISH_TARGET_DIR)/*
	ssh $(PUBLISH_REMOTE_SERVER) unzip photo-printer-app.zip -d $(PUBLISH_TARGET_DIR)
	ssh $(PUBLISH_REMOTE_SERVER) unzip $(PUBLISH_PREV_ZIP_TO) settings.php -d $(PUBLISH_TARGET_DIR)
