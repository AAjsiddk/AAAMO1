'use server';
/**
 * @fileOverview A flow to generate a summary image of user achievements.
 *
 * - generateSummaryImage - A function that takes user stats and returns an HTML string for an image.
 * - GenerateSummaryImageInput - The input type for the generateSummaryImage function.
 * - GenerateSummaryImageOutput - The return type for the generateSummaryImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSummaryImageInputSchema = z.object({
  userName: z.string().describe("The user's name."),
  tasksCompleted: z.number().describe('The total number of completed tasks.'),
  goalsCompleted: z.number().describe('The total number of completed goals.'),
  habitsAcquired: z.number().describe('The total number of acquired habits.'),
});
export type GenerateSummaryImageInput = z.infer<typeof GenerateSummaryImageInputSchema>;

const GenerateSummaryImageOutputSchema = z.object({
  htmlContent: z.string().describe('An HTML string representing the summary card to be converted into an image.'),
});
export type GenerateSummaryImageOutput = z.infer<typeof GenerateSummaryImageOutputSchema>;

export async function generateSummaryImage(input: GenerateSummaryImageInput): Promise<GenerateSummaryImageOutput> {
  return generateSummaryImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryImagePrompt',
  input: { schema: GenerateSummaryImageInputSchema },
  output: { schema: GenerateSummaryImageOutputSchema },
  prompt: `You are a creative UI designer. Your task is to generate a single HTML file content that represents a beautiful and modern achievement summary card. The card should be visually appealing and suitable for sharing on social media.

Use Tailwind CSS classes for styling. The dimensions of the card should be 600px width and 400px height. Do not include <html>, <head>, or <body> tags. Only provide the div for the card itself.

Incorporate the user's data into the design.
- User Name: {{{userName}}}
- Tasks Completed: {{{tasksCompleted}}}
- Goals Completed: {{{goalsCompleted}}}
- Habits Acquired: {{{habitsAcquired}}}

Design requirements:
- Use a dark theme with a gradient background.
- Use a modern, clean font (the app uses Tajawal, but a system font is fine).
- Use icons for each metric (tasks, goals, habits). You can use SVG icons from a library like heroicons (use inline SVG).
- Make the numbers stand out.
- Add a title like "ملخص الإنجازات" (Achievement Summary).
- Ensure all text is in Arabic and right-to-left.

Example of an inline SVG for a checkmark icon: <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>

Generate only the HTML content for the card.
`,
});

const generateSummaryImageFlow = ai.defineFlow(
  {
    name: 'generateSummaryImageFlow',
    inputSchema: GenerateSummaryImageInputSchema,
    outputSchema: GenerateSummaryImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
