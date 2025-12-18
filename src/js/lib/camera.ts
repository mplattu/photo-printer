export class Camera {
    elVideo: HTMLVideoElement|null
    elCanvas: HTMLCanvasElement|null

    constructor(idVideo: string, idCanvas: string) {
        this.elVideo = null
        this.elCanvas = null

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

    startCamera = async () => {
        const constraits: MediaStreamConstraints = {
            video: {
                facingMode: 'user',
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
            },
            audio: false
        }

        if (!this.elVideo) {
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraits);
            this.elVideo.srcObject = stream;
            await this.elVideo.play();
        } catch (err) {
            console.error('Camera error:', err);
        }
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
}
