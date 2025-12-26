import '../css/index.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import { Modal } from 'bootstrap'

import { Camera } from './lib/camera.ts'
import { Communicator } from './lib/communicator.ts'
import { UISetup } from './lib/uisetup.ts'

const DEFAULT_SERVER_URL = 'server.php'

const getServerURL = (): string => {
    const url = new URL(window.location.href)

    const serverURL = url.searchParams.get('server')

    if (serverURL) {
        return serverURL
    }

    return DEFAULT_SERVER_URL
}

window.addEventListener('load', async () => {
    document.addEventListener('disableCameraButtons', () => {
        const elButtonTakePhoto = document.getElementById('takePhoto') as HTMLInputElement
        if (elButtonTakePhoto) { elButtonTakePhoto.disabled = true; }
    })

    document.addEventListener('enableCameraButtons', () => {
        const elButtonTakePhoto = document.getElementById('takePhoto') as HTMLInputElement
        if (elButtonTakePhoto) { elButtonTakePhoto.disabled = false; }
    })

    document.addEventListener('showModal', ((event: CustomEvent): void => {
        const elModalTitle = document.querySelector('#messageModal .modal-title') as HTMLElement
        elModalTitle.innerHTML = event.detail.title

        const elModalText = document.querySelector(`#messageModal .modal-body`) as HTMLElement
        elModalText.innerHTML = event.detail.message

        const modal = new Modal(document.getElementById('messageModal') as HTMLElement)
        modal.show()
    }) as EventListener)

    const uiSetup = new UISetup('video', 'videoTarget') // eslint-disable-line

    const communicator = new Communicator(getServerURL())

    const camera = new Camera('video', 'canvas')
    if (camera.isCameraAvailable()) {
        await camera.startCamera()
    }
    else {
        document.dispatchEvent(
            new CustomEvent('showModal', {
                detail: {
                    title: 'Woot?',
                    message: 'It appears that your device has no camera.'
                }}
            )
        )
    }

    const elButtonTakePhoto = document.getElementById('takePhoto') as HTMLInputElement
    if (elButtonTakePhoto) {
        elButtonTakePhoto.addEventListener('click', () => {
            document.dispatchEvent(new Event('disableCameraButtons'))
            camera.captureImage(communicator.sendImage)
        })
    } else {
        console.error('Did not find takePhoto button')
    }
})

