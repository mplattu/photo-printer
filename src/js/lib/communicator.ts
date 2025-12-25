interface ServerResponse {
    success: boolean;
    message: string;
}
    
export class Communicator {
    backendURL: string

    constructor(backendURL: string) {
        this.backendURL = backendURL
    }

    showMessage = (title: string, message: string) => {
        document.dispatchEvent(
            new CustomEvent(
                'showModal',
                {detail: {
                    title: title,
                    message: message
                }}
            ))
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
                this.showMessage('Error', 'Network response was not ok')
                console.error('Network response was not ok', response.status);
                return
            }

            const responseData: ServerResponse = await response.json()

            if (responseData.success) {
                this.showMessage('Success', responseData.message)
            } else {
                this.showMessage('Failure', responseData.message)
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.showMessage('Failure', error.message)
            }
            console.error('Error sending the image:', error);
        }

        document.dispatchEvent(new Event('enableCameraButtons'))
    }
}
