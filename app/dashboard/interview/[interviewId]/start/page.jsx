"use client"
import { db } from '@/utils/db';
import { MockInterview } from '@/utils/schema';
import { eq } from 'drizzle-orm';
import React, { useEffect, useState } from 'react'
import QuestionsSection from './_components/QuestionsSection';
import RecordAnswerSection from './_components/RecordAnswerSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function StartInterview({params}) {

    const [interviewData,setInterviewData]=useState();
    const [interviewQuestions,setMockInterviewQuestion]=useState();
    const [activeQuestionIndex,setActiveQuestionIndex]=useState(0);
    useEffect(()=>{
        GetInterviewDetails();
    },[]);

    /**
     * Used to Get Interview Details by MockId/Interview Id
     */
    const GetInterviewDetails=async()=>{
      const result=await db.select().from(MockInterview)
      .where(eq(MockInterview.mockId,params.interviewId))
      let jsonMockResp = result[0].jsonMockResp;

          // Clean up the JSON string
          jsonMockResp = jsonMockResp.replace(/```json/g, '').replace(/```/g, '');

          const parsedJson = JSON.parse(jsonMockResp);


          const questionBank = parsedJson.interviewQuestions || parsedJson;
          
      setMockInterviewQuestion(questionBank);
      setInterviewData(result[0]);
  } 
  

  const totalQues = interviewQuestions?.length;
  return (
    <div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
            {/* Questions  */}
            <QuestionsSection 
            mockInterviewQuestion={interviewQuestions}
            activeQuestionIndex={activeQuestionIndex}
            />

            {/* Video/ Audio Recording  */}
            <RecordAnswerSection
             mockInterviewQuestion={interviewQuestions}
             activeQuestionIndex={activeQuestionIndex}
             interviewData={interviewData}
            />
        </div>
        <div className='flex justify-end gap-6'>
          {activeQuestionIndex>0&&  
          <Button onClick={()=>setActiveQuestionIndex(activeQuestionIndex-1)}>Previous Question</Button>}
          {activeQuestionIndex!=totalQues-1&& 
           <Button onClick={()=>setActiveQuestionIndex(activeQuestionIndex+1)}>Next Question</Button>}
          {activeQuestionIndex==totalQues-1 &&  
          <Link href={'/dashboard/interview/'+interviewData?.mockId+"/feedback"}>
          <Button>End Interview</Button>
          </Link>}


        </div>
    </div>
  )
}

export default StartInterview