import { useState, useCallback } from 'react';
import { mediaDevices, MediaStream } from 'react-native-webrtc';

interface MediaDeviceInfo {
  deviceId: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
  label: string;
  facing?: 'user' | 'environment';
  groupId?: string;
}

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const startCamera = useCallback(async (frontCamera = isFrontCamera) => {
    try {
      const devices = await mediaDevices.enumerateDevices() as MediaDeviceInfo[];
      let videoSourceId: string | undefined;
 
      devices.forEach((device) => {
        if (
          device.kind === 'videoinput' &&
          device.facing === (frontCamera ? 'user' : 'environment')
        ) {
          videoSourceId = device.deviceId;
        }
      });
      
      const newStream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: frontCamera ? 'user' : 'environment',
        },
      });
      setStream(newStream);

    } catch (error) {
      console.error('Erro ao iniciar a câmara:', error);
    }
  }, [isFrontCamera]);

  const stopCamera = useCallback(() => {
    if (stream?.active) {
      stream.getTracks().forEach((track) => {
        track.stop(); // Stop each track
      });
      setStream(null); // Clear the stream
    } else {
      console.log("No active stream to stop.");
    }
  }, [stream]);


  const rotateCamera = useCallback(() => {
    stopCamera();
    const newIsFrontCamera = !isFrontCamera;
    setIsFrontCamera(newIsFrontCamera);
    setTimeout(() => {
      startCamera(newIsFrontCamera);
    }, 100);
  }, [stopCamera, startCamera, isFrontCamera]);

  return {
    stream,
    isFrontCamera,
    startCamera,
    stopCamera,
    rotateCamera,
  };
}
