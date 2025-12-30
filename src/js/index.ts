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
    const setupButtonTakePhoto = (): void => {
        const elButtonTakePhoto = document.getElementById('takePhoto') as HTMLInputElement
        if (elButtonTakePhoto) {
            elButtonTakePhoto.addEventListener('click', () => {
                document.dispatchEvent(new Event('disableCameraButtons'))
                camera.captureImage(communicator.sendImage)
            })
        } else {
            console.error('Did not find takePhoto button')
        }
    }

    const setButtonSwitchCameraLegend = (): void  => {
        const numberOfCameras = camera.numberOfCameras()
        const currentCameraNumber = 1+camera.currentCameraIndex

        const elButtonSwitchCamera = document.getElementById('switchCamera') as HTMLInputElement
        if (elButtonSwitchCamera) {
            elButtonSwitchCamera.textContent = `Camera ${currentCameraNumber}/${numberOfCameras}`
        }
    }

    const setupButtonSwitchCamera = (numberOfCameras: number): void => {
        const elButtonSwitchCamera = document.getElementById('switchCamera') as HTMLInputElement
        if (elButtonSwitchCamera) {
            if (numberOfCameras < 2) {
                elButtonSwitchCamera.style.display = 'none'
            } else {
                elButtonSwitchCamera.style.display = 'block'
                setButtonSwitchCameraLegend()
            }

            elButtonSwitchCamera.addEventListener('click', () => {
                camera.switchCamera()
                setButtonSwitchCameraLegend()
            })
        } else {
            console.error('Did not find switchCamera button')
        }
    }

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
        const numberOfCameras = await camera.startCamera()
        setupButtonSwitchCamera(numberOfCameras)
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

    setupButtonTakePhoto()
})

