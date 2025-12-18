# webapp

MobiiliPassi webapp is HTML5 application written in TypeScript. At the moment
is does not utilise any web development framework.

## Development environment

 1. Install [nvm](https://github.com/nvm-sh/nvm)
 1. (Install and) activate NodeJS version specified in `.nvmrc` by issuing command `nvm use`
 1. Install npm package dependencies: `npm install`

After this you can use rules in `Makefile`:
 * `make build` - Build the webapp to `build/`
 * `make publish` - Publish the code in `build/` to test server
 * `make start` - Run the PHP test server, which stores the images to `/tmp/mp_webapp`

## Configuration

 * You can specify the backend URL in the query parameter: `https://localhost:8080?server=https://another.dev/backend`. This requires some CORS settings to work.
