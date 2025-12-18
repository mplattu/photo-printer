interface ServerResponse {
    success: boolean;
    message: string;
}
    
export class Communicator {
    backendURL: string
    elMessage: HTMLElement

    constructor(backendURL: string, idMessage: string) {
        this.backendURL = backendURL

        this.elMessage = <HTMLElement> document.getElementById(idMessage)
        if (! this.elMessage) {
            console.error('Message element was not found', idMessage)
            return
        }
    }

    setMessage = (message: string) => {
        this.elMessage.innerHTML = message
    }

    sendImage: BlobCallback = async (blob: Blob | null): Promise<void> => {
        if (!blob) {
            console.error('sendImage did not get blob')
            return
        }

        const formData = new FormData()
        formData.append('image', blob, 'image.png')
        try {
            const response = await fetch(this.backendURL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                this.setMessage('Network response was not ok')
                console.error('Network response was not ok', response.status);
                return
            }

            const responseData: ServerResponse = await response.json()

            if (responseData.success) {
                this.setMessage(`Success: ${responseData.message}`)
            } else {
                this.setMessage(`Failure: ${responseData.message}`)
            }
        } catch (error) {
            this.setMessage(`Could not send image: ${error}`)
            console.error('Error sending the image:', error);
        }        
    }
}
