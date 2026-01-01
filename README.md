# Photo Printer

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
