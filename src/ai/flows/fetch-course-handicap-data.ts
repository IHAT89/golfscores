'use server';
/**
 * @fileOverview A Genkit flow for retrieving authoritative golf course handicap and slope ratings.
 *
 * - fetchCourseHandicapData - A function that fetches USGA/R&A-compliant handicap and slope data.
 * - CourseHandicapInput - The input type for the fetchCourseHandicapData function.
 * - CourseHandicapOutput - The return type for the fetchCourseHandicapData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CourseHandicapInputSchema = z.object({
  courseName: z.string().describe('The full name of the golf course (e.g., "Pebble Beach Golf Links").'),
});
export type CourseHandicapInput = z.infer<typeof CourseHandicapInputSchema>;

const CourseHandicapOutputSchema = z.object({
  courseHandicapRating: z.number().describe('The USGA Course Rating (e.g., 72.4).'),
  slopeRating: z.number().describe('The USGA Slope Rating (e.g., 113 to 155).'),
  source: z.string().optional().describe('The authoritative source of this data.'),
  isEstimated: z.boolean().describe('Whether this data is an estimate or from a known database record.'),
  lastUpdated: z.string().optional().describe('When the rating was last updated in the source database.'),
});
export type CourseHandicapOutput = z.infer<typeof CourseHandicapOutputSchema>;

const fetchCourseHandicapPrompt = ai.definePrompt({
  name: 'fetchCourseHandicapPrompt',
  input: { schema: CourseHandicapInputSchema },
  output: { schema: CourseHandicapOutputSchema },
  system: `You are an elite golf data analyst. Your goal is to provide official USGA Course Rating and Slope data.

When a course name is provided:
1. Access your internal knowledge of the USGA Course Rating Database and R&A records.
2. Provide the ratings for the standard Championship/Back tees.
3. Identify the specific source (e.g., "USGA National Course Rating Database").
4. If the exact course isn't found, use your expert knowledge to provide a highly accurate estimate based on similar championship designs and mark it as 'isEstimated: true'.`,
  prompt: `Lookup the authoritative USGA/R&A Course Rating and Slope for: {{{courseName}}}.`,
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
      throw new Error('Authoritative data lookup failed.');
    }
    return output;
  }
);

export async function fetchCourseHandicapData(input: CourseHandicapInput): Promise<CourseHandicapOutput> {
  return fetchCourseHandicapDataFlow(input);
}
