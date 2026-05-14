'use server';
/**
 * @fileOverview A Genkit flow and tool for retrieving golf course handicap and slope ratings.
 *
 * - fetchCourseHandicapData - A function that fetches the handicap and slope data for a given golf course.
 * - CourseHandicapInput - The input type for the fetchCourseHandicapData function.
 * - CourseHandicapOutput - The return type for the fetchCourseHandicapData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CourseHandicapInputSchema = z.object({
  courseName: z.string().describe('The full name of the golf course for which to retrieve handicap data.'),
});
export type CourseHandicapInput = z.infer<typeof CourseHandicapInputSchema>;

const CourseHandicapOutputSchema = z.object({
  courseHandicapRating: z.number().describe('The course handicap rating.'),
  slopeRating: z.number().describe('The slope rating.'),
});
export type CourseHandicapOutput = z.infer<typeof CourseHandicapOutputSchema>;

// Mock data for course handicaps. In a real application, this would come from an external API or database.
const MOCK_COURSE_DATA: { [key: string]: CourseHandicapOutput } = {
  'Seletar Country Club': {
    courseHandicapRating: 72.0,
    slopeRating: 130,
  },
  'Sentosa Golf Club - Serapong Course': {
    courseHandicapRating: 75.0,
    slopeRating: 145,
  },
  'Laguna National Golf Resort Club': {
    courseHandicapRating: 73.5,
    slopeRating: 138,
  },
  'Tanah Merah Country Club - Garden Course': {
    courseHandicapRating: 72.8,
    slopeRating: 135,
  },
};

const getCourseHandicapData = ai.defineTool(
  {
    name: 'getCourseHandicapData',
    description: 'Retrieves the course handicap rating and slope rating for a given golf course. If the course is not found or only partially matched, it returns sensible default values.',
    inputSchema: CourseHandicapInputSchema,
    outputSchema: CourseHandicapOutputSchema,
  },
  async (input) => {
    const searchName = input.courseName.toLowerCase();
    for (const key in MOCK_COURSE_DATA) {
      if (key.toLowerCase().includes(searchName)) { // Case-insensitive partial match
        return MOCK_COURSE_DATA[key];
      }
    }
    // Return default values for an unknown or unmatched course
    console.warn(`Course '${input.courseName}' not found or partially matched in mock data. Returning default handicap values.`);
    return {
      courseHandicapRating: 71.0, // A sensible default
      slopeRating: 120,          // A sensible default
    };
  }
);

const fetchCourseHandicapPrompt = ai.definePrompt({
  name: 'fetchCourseHandicapPrompt',
  input: {schema: CourseHandicapInputSchema},
  output: {schema: CourseHandicapOutputSchema},
  tools: [getCourseHandicapData],
  system: `You are an AI assistant specialized in golf course information. Your task is to provide the course handicap rating and slope rating for a specified golf course.
Use the 'getCourseHandicapData' tool to retrieve this information. Only respond with the JSON object containing the 'courseHandicapRating' and 'slopeRating' as defined by the output schema.`,
  prompt: `Retrieve the course handicap rating and slope rating for the golf course named: {{{courseName}}}.`,
});

const fetchCourseHandicapDataFlow = ai.defineFlow(
  {
    name: 'fetchCourseHandicapDataFlow',
    inputSchema: CourseHandicapInputSchema,
    outputSchema: CourseHandicapOutputSchema,
  },
  async (input) => {
    const {output} = await fetchCourseHandicapPrompt(input);
    if (!output) {
      throw new Error('Failed to retrieve course handicap data.');
    }
    return output;
  }
);

export async function fetchCourseHandicapData(input: CourseHandicapInput): Promise<CourseHandicapOutput> {
  return fetchCourseHandicapDataFlow(input);
}
