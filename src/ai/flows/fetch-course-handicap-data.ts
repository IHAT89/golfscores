'use server';
/**
 * @fileOverview A Genkit flow for retrieving authoritative golf course handicap and slope ratings.
 *
 * - fetchCourseHandicapData - A function that fetches USGA-compliant handicap and slope data.
 * - CourseHandicapInput - The input type for the fetchCourseHandicapData function.
 * - CourseHandicapOutput - The return type for the fetchCourseHandicapData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CourseHandicapInputSchema = z.object({
  courseName: z.string().describe('The full name of the golf course, including location if possible (e.g., "Pebble Beach Golf Links, CA").'),
});
export type CourseHandicapInput = z.infer<typeof CourseHandicapInputSchema>;

const CourseHandicapOutputSchema = z.object({
  courseHandicapRating: z.number().describe('The USGA Course Rating (typically a decimal like 72.4).'),
  slopeRating: z.number().describe('The USGA Slope Rating (typically an integer between 55 and 155).'),
  source: z.string().optional().describe('The authoritative source or governing body for this data.'),
  isEstimated: z.boolean().describe('Whether this data is an estimate or from a known database record.'),
});
export type CourseHandicapOutput = z.infer<typeof CourseHandicapOutputSchema>;

const fetchCourseHandicapPrompt = ai.definePrompt({
  name: 'fetchCourseHandicapPrompt',
  input: { schema: CourseHandicapInputSchema },
  output: { schema: CourseHandicapOutputSchema },
  system: `You are an expert golf analytics assistant. Your primary task is to provide official USGA Course Rating and Slope Rating data for specific golf courses.

When a user provides a course name:
1. Search your internal knowledge base for the most up-to-date and authoritative ratings for that course.
2. If the course has multiple tees, default to the "Championship" or "Back" tees (usually the highest difficulty).
3. Identify the source of the data (e.g., "USGA Course Rating Database", "R&A", "Club Website").
4. If you are unsure of the exact ratings, provide a highly accurate estimate based on similar championship-grade courses and set 'isEstimated' to true.

Always return a valid JSON object matching the output schema.`,
  prompt: `Retrieve the authoritative USGA Course Rating and Slope Rating for the following golf course: {{{courseName}}}.`,
});

const fetchCourseHandicapDataFlow = ai.defineFlow(
  {
    name: 'fetchCourseHandicapDataFlow',
    inputSchema: CourseHandicapInputSchema,
    outputSchema: CourseHandicapOutputSchema,
  },
  async (input) => {
    const { output } = await fetchCourseHandicapPrompt(input);
    if (!output) {
      throw new Error('Could not retrieve authoritative handicap data for this course.');
    }
    return output;
  }
);

export async function fetchCourseHandicapData(input: CourseHandicapInput): Promise<CourseHandicapOutput> {
  return fetchCourseHandicapDataFlow(input);
}
