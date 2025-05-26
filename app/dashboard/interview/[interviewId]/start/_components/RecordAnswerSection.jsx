"use client";
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import useSpeechToText from 'react-hook-speech-to-text';
import { Mic, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import { chatSession } from '@/utils/GeminiAIModal';
import { db } from '@/utils/db';
import { UserAnswer } from '@/utils/schema';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';
import FaceFeedback from './FaceFeedback'; // Importing FaceFeedback component

function RecordAnswerSection({ mockInterviewQuestion = {}, activeQuestionIndex, interviewData }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [faceFeedback, setFaceFeedback] = useState(''); // State to store face feedback
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const interviewQuestions = mockInterviewQuestion;

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    results?.forEach((result) => {
      setUserAnswer((prevAns) => prevAns + result?.transcript);
    });
  }, [results]);

  useEffect(() => {
    console.log({ userAnswer, isRecording });

    if (userAnswer?.length > 10) {
      console.log("Inside if");
      UpdateUserAnswer();
    }
  }, [userAnswer]);

  const StartStopRecording = async () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  const UpdateUserAnswer = async () => {
    try {
      setLoading(true);

      // Updated feedback prompt asking for detailed ratings and feedback
      const feedbackPrompt = `
      You are a professional interview coach. Evaluate the candidate's answer based on:
  
      1. Clarity of Communication
      2. Confidence and Tone
      3. Technical Relevance
      4. Structure and Flow
  
      **Question:** "${interviewQuestions[activeQuestionIndex]?.question}"
      **User Answer:** "${userAnswer}"
  
      Give your feedback in this JSON format:
      {
        "rating": 1 to 10, // One overall rating considering all factors
        "feedback": "Short paragraph (3-5 lines) suggesting improvements across both technical and soft skills."
      }
  
      Only respond with valid JSON.
      `;

      console.log({ feedbackPrompt });

      // Send the updated prompt to Gemini API
      const result = await chatSession.sendMessage(feedbackPrompt);

      // Parse the JSON response (same as before)
      const mockJsonResp = (await result.response.text()).replace('```json', '').replace('```', '');
      const JsonFeedbackResp = JSON.parse(mockJsonResp);

      // Store the response in the database (now including faceFeedback)
      const resp = await db.insert(UserAnswer)
        .values({
          mockIdRef: interviewData?.mockId,
          question: interviewQuestions[activeQuestionIndex]?.question,
          correctAns: interviewQuestions[activeQuestionIndex]?.answer,
          userAns: userAnswer,
          feedback: JsonFeedbackResp?.feedback,
          rating: JsonFeedbackResp?.rating,
          faceFeedback: faceFeedback, // Including face feedback from FaceFeedback component
          userEmail: user?.primaryEmailAddress?.emailAddress,
          createdAt: moment().format('DD-MM-yyyy'),
        });

      if (resp) {
        toast('User Answer recorded successfully');
        setUserAnswer('');  // Reset the user answer
        setResults([]);     // Clear the speech-to-text results
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error updating user answer:", error);
      setLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center flex-col'>
      <div className='flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5'>
        <Image src={'/webcam.png'} width={200} height={200} className='absolute' />
        <Webcam
          mirrored={true}
          style={{
            height: 500,
            width: 500,
            zIndex: 10,
          }}
        />
      </div>

      {/* Face Feedback Component */}
      <FaceFeedback onFeedback={(feedbackMessage) => setFaceFeedback(feedbackMessage)} />

      {/* Display user answer and face feedback */}
      <p>{userAnswer}</p>
      <p><strong>Face Feedback:</strong> {faceFeedback}</p> {/* Display face feedback here */}

      <Button
        disabled={loading}
        variant="outline" className="my-10"
        onClick={StartStopRecording}
      >
        {isRecording ? 
          <h2 className='text-red-600 animate-pulse flex gap-2 items-center'>
            <StopCircle />Stop Recording
          </h2>
          :
          <h2 className='text-primary flex gap-2 items-center'>
            <Mic />  Record Answer
          </h2>}
      </Button>
    </div>
  );
}

export default RecordAnswerSection;
