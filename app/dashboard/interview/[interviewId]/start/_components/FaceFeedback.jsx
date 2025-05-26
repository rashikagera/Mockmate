'use client';

import React, { useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks, FACEMESH_TESSELATION } from '@mediapipe/drawing_utils';

const FaceFeedback = ({ onFeedback }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(handleResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
      },
      width: 500,
      height: 500,
    });

    camera.start();

    function handleResults(results) {
      const canvasCtx = canvasRef.current.getContext('2d');
      canvasCtx.clearRect(0, 0, 500, 500);

      if (results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#00FF00' });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

        const feedback = getFaceFeedback(landmarks);
        onFeedback(feedback);
      }
    }

    return () => {
      camera.stop();
    };
  }, []);

  const getFaceFeedback = (landmarks) => {
    const feedback = [];

    const leftEye = landmarks[159];
    const rightEye = landmarks[386];
    const noseTip = landmarks[1];
    const chin = landmarks[152];
    const leftMouth = landmarks[78];
    const rightMouth = landmarks[308];
    const topLip = landmarks[13];
    const bottomLip = landmarks[14];

    if (Math.abs(leftEye.x - rightEye.x) > 0.1) {
      feedback.push('Poor eye contact.');
    } else {
      feedback.push('Good eye contact.');
    }

    if (chin.y > noseTip.y) {
      feedback.push('Head not aligned. Look straight.');
    }

    if ((rightMouth.x - leftMouth.x) > 0.1) {
      feedback.push('You are smiling!');
    } else if ((bottomLip.y - topLip.y) > 0.05) {
      feedback.push('Try to relax, don’t frown.');
    }

    return feedback;
  };

  return (
    <div className="relative">
      <video ref={videoRef} style={{ display: 'none' }} autoPlay />
      <canvas ref={canvasRef} width="500" height="500" className="rounded-lg" />
    </div>
  );
};

export default FaceFeedback;
