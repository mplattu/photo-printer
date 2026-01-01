# Photo Printer

Remember the days when you had to take 24 pictures and develop the film to see how
you've done? Or if you were in a hurry and lotsa money, you might have a Polaroid
and see your pictures right a way?

With Photo Printer you can experience the history in the privacy of your own home!

## Operation

Let's say you have a party. You give your guests an URL of your Photo Printer.
They open the web address with their mobile devices. The Photo Printer asks for
permission to use the camera. Once provided, the app will display the camera
image.

When the partygoer takes a picture, it is saved in the Photo Printer server
app's photo queue.

Once the number of pictures you set in the program settings has been taken,
all the pictures are printed to the printer. Your network printer will be
the focal point of your next party!

## Setup

All you need is:
 * Web server with https connection. An unencrypted http connection won't do.
 * Network printer which supports IPP protocal and is able to print a PDF file.
 * Local area network connecting the two above. The web server must be able to
   connect the printer (port 631/tcp).

Do this:
 1. Atm there are no prebuilt applications. You need to have both PHP and NodeJS
    installed (see [nvm](https://github.com/nvm-sh/nvm))
 1. `cd photo-printer`
 1. `nvm install && nvm use` (to install and use the NodeJS version specified in `.nvmrc`) 
 1. `npm install` (to install required npm packages)
 1. `make build` (to install PHP package manager `composer.phar` and build both back and frontend)

To try this locally say `make start` and browse to http://localhost:8080.

## Server

Your server needs to have PHP support. If you don't happen to have one at
your home network, you can easily set things up using Docker.

 1. `mkdir -p /srv/photo-printer/app`
 1. `mkdir -p /srv/photo-printer/data`
 1. `echo "client_max_body_size 0;" >/srv/photo-printer/nginx-server.conf`
 1. Publish your Photo Printer to `/srv/photo-printer/app` (see below)
 1. Finally, start the container:
    ```
    docker run -d -p 8080 --rm --name=photo-printer \
        -v /srv/photo-printer/app/:/var/www/html \
        -v /srv/photo-printer/nginx-server.conf:/etc/nginx/conf.d/server.conf \
        -v /srv/photo-printer/data/:/tmp/photo-printer \
        trafex/php-nginx
    ```

At this point you may think that its time to profit? Not yet!

To make the camera work in the browser, you need a https connection. Therefore,
your home server's web server should have an SSL certificate pre-set. If you
happen to run nginx, you might this configuration example useful:

```
location /pardyyy/ {
    proxy_pass http://127.0.0.1:8080/;
    include proxy_params;
    client_max_body_size 0;
}
```

Now the Photo Printer is available at https://your.home.server/pardyyy/

## Settings

Your application directory should contain `settings.php`. See
`src/backend/settings-template.php` for a template.

## Publishing

The publishing is done over ssh connection.

 1. Create `settings.mk` with following template:
    ```
    PUBLISH_REMOTE_SERVER:=your-server.com
    PUBLISH_COPY_ZIP_TO:=/tmp
    PUBLISH_TARGET_DIR:=/path/to/photo-printer-app
    PUBLISH_PREV_ZIP_TO:=/tmp/photo-printer-app-prev.zip
    ```
    * `PUBLISH_REMOTE_SERVER` - the server address given to ssh to connect
    * `PUBLISH_COPY_ZIP_TO` - where the publish script copies (and leaves) the application script
    * `PUBLISH_TARGET_DIR` - a path to your application
    * `PUBLISH_PREV_ZIP_TO` - where the publish script stores the previous published application version
