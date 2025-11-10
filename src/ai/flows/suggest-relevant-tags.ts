'use server';

/**
 * @fileOverview A flow that suggests relevant tags for a given piece of information.
 *
 * - suggestRelevantTags - A function that suggests relevant tags based on the content of the information.
 * - SuggestRelevantTagsInput - The input type for the suggestRelevantTags function.
 * - SuggestRelevantTagsOutput - The return type for the suggestRelevantTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelevantTagsInputSchema = z.object({
  informationContent: z
    .string()
    .describe(
      'The content of the information for which tags are to be suggested.'
    ),
});
export type SuggestRelevantTagsInput = z.infer<typeof SuggestRelevantTagsInputSchema>;

const SuggestRelevantTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of relevant tags suggested by the AI.'),
});
export type SuggestRelevantTagsOutput = z.infer<typeof SuggestRelevantTagsOutputSchema>;

export async function suggestRelevantTags(
  input: SuggestRelevantTagsInput
): Promise<SuggestRelevantTagsOutput> {
  return suggestRelevantTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelevantTagsPrompt',
  input: {schema: SuggestRelevantTagsInputSchema},
  output: {schema: SuggestRelevantTagsOutputSchema},
  prompt: `You are an AI assistant that suggests relevant tags for a given piece of information. The tags should be concise and descriptive of the content.

  Information Content: {{{informationContent}}}

  Suggest relevant tags:`,
});

const suggestRelevantTagsFlow = ai.defineFlow(
  {
    name: 'suggestRelevantTagsFlow',
    inputSchema: SuggestRelevantTagsInputSchema,
    outputSchema: SuggestRelevantTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
