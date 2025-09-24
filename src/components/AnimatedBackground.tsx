
import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

// Define the floating animation
const float = keyframes`
  0% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-30px) translateX(20px) rotate(10deg);
    opacity: 0.4;
  }
  100% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.8;
  }
`;

const AnimatedBackground: React.FC = () => {
  const circles = [
    { size: '150px', top: '15%', left: '10%', animationDuration: '15s' },
    { size: '80px', top: '30%', left: '80%', animationDuration: '12s' },
    { size: '120px', top: '70%', left: '20%', animationDuration: '18s' },
    { size: '60px', top: '85%', left: '60%', animationDuration: '10s' },
    { size: '200px', top: '5%', left: '50%', animationDuration: '20s' },
    { size: '100px', top: '50%', left: '40%', animationDuration: '16s' },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {circles.map((circle, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            top: circle.top,
            left: circle.left,
            width: circle.size,
            height: circle.size,
            backgroundColor: 'primary.main', // Use the main orange color
            opacity: 0.15, // Base opacity
            borderRadius: '50%',
            animation: `${float} ${circle.animationDuration} ease-in-out infinite`,
            animationDelay: `${index * 2}s`, // Stagger the animations
          }}
        />
      ))}
    </Box>
  );
};

export default AnimatedBackground;
