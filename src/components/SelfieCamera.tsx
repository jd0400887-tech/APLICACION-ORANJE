import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';

interface SelfieCameraProps {
  open: boolean;
  onClose: () => void;
  onPictureTaken: (imageDataUrl: string) => void;
}

const SelfieCamera: React.FC<SelfieCameraProps> = ({ open, onClose, onPictureTaken }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);

  const startCamera = useCallback(async () => {
    setLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      onClose(); // Close dialog if camera access is denied
    } finally {
      setLoading(false);
    }
  }, [onClose]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

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
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup on unmount
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Check-in Selfie</DialogTitle>
      <DialogContent sx={{ position: 'relative', minHeight: '300px' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: 'auto', display: loading ? 'none' : 'block' }}
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