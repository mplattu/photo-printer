export class Camera {
    elVideo: HTMLVideoElement|null
    elCanvas: HTMLCanvasElement|null
    currentStream: MediaStream|null
    readonly defaultMediaConstraints: MediaStreamConstraints
    cameras: MediaDeviceInfo[]
    currentCameraIndex: number
    
    constructor(idVideo: string, idCanvas: string) {
        this.elVideo = null
        this.elCanvas = null
        this.currentStream = null
        this.cameras = []
        this.currentCameraIndex = 0

        this.defaultMediaConstraints = {
            audio: false,
            video: {
                width: {
                    min: 1280,
                    ideal: 1280,
                    max: 1920
                },
                height: {
                    min: 720,
                    ideal: 720,
                    max: 1080
                }
            }
        }

        this.elVideo = <HTMLVideoElement> document.getElementById(idVideo)
        if (! this.elVideo) {
            console.error('Video element was not found', idVideo)
            return
        }

        this.elCanvas = <HTMLCanvasElement> document.getElementById(idCanvas)
        if (! this.elCanvas) {
            console.error('Canvas element was not found', idCanvas)
            return
        }

        this.elCanvas.style.display = 'none'
    }

    isCameraAvailable = () => {
        return navigator.mediaDevices != undefined
    }

    scanCameras = async (): Promise<MediaDeviceInfo[]> => {
        const mediaDevices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices()

        const cameras: MediaDeviceInfo[] = []

        mediaDevices.forEach(mediaDevice => {
            if (mediaDevice.kind === 'videoinput') {
                cameras.push(mediaDevice)
            }
        })

        return cameras
    }

    numberOfCameras = (): number => {
        return this.cameras.length
    }

    startCamera = async (): Promise<number> => {
        if (!this.elVideo) {
            return 0
        }

        await this.switchCamera()

        this.cameras = await this.scanCameras()
        return this.numberOfCameras()
    }

    captureImage = async (callbackFn: BlobCallback) => {
        if (!this.elVideo || !this.elCanvas) {
            return
        }

        const width = this.elVideo.videoWidth;
        const height = this.elVideo.videoHeight;

        if (!width || !height) return;

        this.elCanvas.width = width;
        this.elCanvas.height = height;

        const ctx = this.elCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(this.elVideo, 0, 0, width, height);

        this.elCanvas.toBlob(callbackFn, 'image/png', 0.95);
    }

    changeCurrentCameraIndex = () => {
        this.currentCameraIndex++
        if (this.currentCameraIndex >= this.cameras.length) {
            this.currentCameraIndex = 0
        }
    }

    switchCamera = async () => {
        if (!this.elVideo) {
            return
        }

        if (this.currentStream != null) {
            this.currentStream.getTracks().forEach(track => {
                track.stop()
            })
        }

        const constraints = this.defaultMediaConstraints

        if (this.cameras.length > 0) {
            this.changeCurrentCameraIndex()
            constraints.video.deviceId = this.cameras[this.currentCameraIndex].deviceId
        }

        try {
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints)
            this.elVideo.srcObject = this.currentStream
            await this.elVideo.play();
        } catch (err) {
            console.debug(err)
            return
        }
    }
}
