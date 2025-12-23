export class UISetup {
    elVideo: HTMLVideoElement
    elTarget: HTMLElement|null

    constructor(idVideo: string, idTarget: string) {
        this.elVideo = this.getElementOrMakeException(idVideo) as HTMLVideoElement
        this.elTarget = this.getElementOrMakeException(idTarget) as HTMLElement

        if (this.elVideo == null) {
            return
        }

        this.elVideo.addEventListener('playing', () => { this.adjustVideoAndTarget() })
        window.addEventListener('resize', () => { this.adjustVideoAndTarget() })
    }

    getElementOrMakeException = (id: string): HTMLVideoElement|HTMLElement => {
        const element = document.getElementById(id)
        if (! element) {
            throw new Error(`Missing element ID: ${id}`)
        }

        return element
    }

    adjustVideoAndTarget = (): void => {
        if (! this.elVideo || ! this.elTarget) {
            return
        }

        if (this.elVideo.videoWidth == 0 || this.elVideo.videoHeight == 0) {
            return
        }

        this.elVideo.style.width = `${window.innerWidth}px`
        this.elVideo.style.height = `${window.innerHeight}px`

        const videoScaleHorizontal = this.elVideo.videoWidth / window.innerWidth
        const videoScaleVertical = this.elVideo.videoHeight / window.innerHeight

        const videoScale = Math.max(videoScaleHorizontal, videoScaleVertical)
        const videoMinDimension = Math.min(this.elVideo.videoWidth, this.elVideo.videoHeight)

        const targetDimension = videoMinDimension / videoScale

        this.elTarget.style.width = `${targetDimension}px`
        this.elTarget.style.height = `${targetDimension}px`

        const leftPosition = (window.innerWidth - targetDimension) / 2
        const topPosition = (window.innerHeight - targetDimension) / 2

        this.elTarget.style.left = `${leftPosition}px`
        this.elTarget.style.top = `${topPosition}px`
    }
}
