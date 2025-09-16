import React, { useRef, useState, useCallback, useEffect } from 'react';
  import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Typography }
  from '@mui/material';

  interface SelfieCameraProps {
    open: boolean;
    onClose: () => void;
    onPictureTaken: (imageDataUrl: string) => void;
  }

  const SelfieCamera: React.FC<SelfieCameraProps> = ({ open, onClose, onPictureTaken }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null); // Added streamRef
    const [loading, setLoading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Effect to keep streamRef updated
    useEffect(() => {
      streamRef.current = stream;
    }, [stream]);

    const startCamera = useCallback(async () => {
      console.log('startCamera: called', { open });
      setLoading(true);
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(mediaStream);
        console.log('startCamera: stream obtained', mediaStream);
        setCameraError(null); // Clear any previous error
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setCameraError('Error al acceder a la cámara: ' + (err.message || err));
      } finally {
        setLoading(false);
        console.log('startCamera: finished', { loading: false });
      }
    }, []); // Changed dependencies to empty array

    // Effect to set video srcObject when stream is available
    useEffect(() => {
      console.log('useEffect [videoRef, stream]: running', { videoRefCurrent: videoRef.current, stream });
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        console.log('useEffect [videoRef, stream]: srcObject set');
      }
    }, [videoRef, stream]);

    const stopCamera = useCallback(() => {
      console.log('stopCamera: called', { stream: streamRef.current }); // Used streamRef.current
      if (streamRef.current) { // Used streamRef.current
        streamRef.current.getTracks().forEach(track => track.stop());
        setStream(null);
        console.log('stopCamera: stream stopped');
      }
    }, []); // Changed dependencies to empty array

    const handleCapture = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const imageDataUrl = canvas.toDataURL('image/jpeg');
          onPictureTaken(imageDataUrl);
        }
        stopCamera();
      }
    };

    // Effect to start/stop camera when dialog opens/closes
    useEffect(() => {
      console.log('useEffect [open]: running', { open, stream, loading, cameraError });
      if (open) {
        startCamera();
      } else {
        stopCamera();
      }
      // Cleanup on unmount
      return () => {
        console.log('useEffect cleanup: stopCamera');
        stopCamera();
      };
    }, [open]); // Changed dependencies to only [open]

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Check-in Selfie</DialogTitle>
        <DialogContent sx={{ position: 'relative', minHeight: '300px' }}>
          {console.log('Render: ', { loading, cameraError, stream })}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          )}
          {cameraError && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%',
  color: 'error.main' }}>
              <Typography variant="body1" align="center">{cameraError}</Typography>
            </Box>
          )}
          {!loading && !cameraError && !stream && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%',
  color: 'text.secondary' }}>
              <Typography variant="body1" align="center">Esperando acceso a la cámara...</Typography>
            </Box>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: 'auto', display: loading || cameraError || !stream ? 'none' :
  'block' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleCapture} variant="contained" disabled={loading || !stream}>
            Take Picture
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  export default SelfieCamera;