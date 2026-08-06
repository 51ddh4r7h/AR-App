export const startCameraStream = async (): Promise<MediaStream> =>
  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  })

export const stopCameraStream = (stream: MediaStream | null): void => {
  stream?.getTracks().forEach((track) => track.stop())
}

