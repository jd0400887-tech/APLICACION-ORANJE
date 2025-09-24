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
    const streamRef = useRef<MediaStream | null>(null);
    const [loading, setLoading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
      streamRef.current = stream;
    }, [stream]);

    const startCamera = useCallback(async () => {
      setLoading(true);
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(mediaStream);
        setCameraError(null);
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setCameraError('Error al acceder a la cámara: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [videoRef, stream]);

    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }, []);

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

    useEffect(() => {
      if (open) {
        startCamera();
      } else {
        stopCamera();
      }
      return () => {
        stopCamera();
      };
    }, [open]);

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Check-in Selfie</DialogTitle>
        <DialogContent sx={{ position: 'relative', minHeight: '300px' }}>
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