import '../css/index.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import { Camera } from './lib/camera.ts'
import { Communicator } from './lib/communicator.ts'
import { UISetup } from './lib/uisetup.ts'

const DEFAULT_SERVER_URL = '/server.php'

const getServerURL = (): string => {
    const url = new URL(window.location.href)

    const serverURL = url.searchParams.get('server')

    if (serverURL) {
        return serverURL
    }

    return DEFAULT_SERVER_URL
}

window.addEventListener('load', async () => {
    const uiSetup = new UISetup('video', 'videoTarget') // eslint-disable-line

    const communicator = new Communicator(getServerURL(), 'message')

    const camera = new Camera('video', 'canvas')
    if (camera.isCameraAvailable()) {
        await camera.startCamera()
    }
    else {
        alert("No camera")
    }

    const elButtonTakePhoto = document.getElementById('takePhoto')
    if (elButtonTakePhoto) {
        elButtonTakePhoto.addEventListener('click', () => {
            camera.captureImage(communicator.sendImage)
        })
    } else {
        console.error('Did not find takePhoto button')
    }
})

