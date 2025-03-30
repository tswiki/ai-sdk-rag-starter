// import { createResource } from '@/lib/actions/resources';
// import { openai } from '@ai-sdk/openai';
// import { Message, streamText, tool } from 'ai';
// import { anthropic } from '@ai-sdk/anthropic';
// import { z } from 'zod';
// import { findRelevantContent } from '@/lib/ai/embedding';

// // Allow streaming responses up to 30 seconds
// export const maxDuration = 30;


// export async function POST(req: Request) {
//   const { messages, experimental_attachments }: { messages: Message[], experimental_attachments?: any[] } = await req.json();
  
//   // Check if user has sent a PDF or image
//   const hasAttachments = messages.some(message =>
//     message.experimental_attachments?.some(
//       a => a.contentType === 'application/pdf' || a.contentType?.startsWith('image/')
//     ),
//   );

//   const result = streamText({
//     model: anthropic('claude-3-7-sonnet-20250219'),
//     messages,
//     ...(experimental_attachments ? { experimental_attachments } : {}),
//     system: `You are a helpful assistant. Check your knowledge base
//      before answering any questions. If the user uploads a PDF or image, analyze its content
//      and respond to queries about it. If no relevant information is 
//      found in the tool calls, ensure to respond using the knowledge
//      base as a reference to ensure the consistency and relevance of the answers.`,
//     tools: {
//       addResource: tool({
//         description: `add a resource to your knowledge base.
//           If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
//         parameters: z.object({
//           content: z
//             .string()
//             .describe('the content or resource to add to the knowledge base'),
//         }),
//         execute: async ({ content }) => createResource({ content }),
//       }),
//       getInformation: tool({
//         description: `if the user asks a personal question or a 
//         specific question get information
//         from your knowledge base to answer questions,
//         ensure to reference the knowledge base for every 
//         question before providing the answer.`,
        
//         parameters: z.object({
//           question: z.string().describe('the users question'),
//         }),
//         execute: async ({ question }) => findRelevantContent(question),
//       }),
//     },
//   });

//   return result.toDataStreamResponse();
// }

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    maxSteps: 5,
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        parameters: z.object({ city: z.string() }),
        execute: async ({}: { city: string }) => {
          return {
            value: 24,
            unit: 'celsius',
            weeklyForecast: [
              { day: 'Monday', value: 24 },
              { day: 'Tuesday', value: 25 },
              { day: 'Wednesday', value: 26 },
              { day: 'Thursday', value: 27 },
              { day: 'Friday', value: 28 },
              { day: 'Saturday', value: 29 },
              { day: 'Sunday', value: 30 },
            ],
          };
        },
      },
      // client-side tool that starts user interaction:
      askForConfirmation: {
        description: 'Ask the user for confirmation.',
        parameters: z.object({
          message: z.string().describe('The message to ask for confirmation.'),
        }),
      },
      // client-side tool that is automatically executed on the client:
      getLocation: {
        description:
          'Get the user location. Always ask for confirmation before using this tool.',
        parameters: z.object({}),
      },
    },
  });

  return result.toDataStreamResponse();
}