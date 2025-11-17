import { config } from 'dotenv';
config();

import '@/ai/flows/generate-initial-structure-from-prompt.ts';
import '@/ai/flows/summarize-notes.ts';
import '@/ai/flows/suggest-relevant-tags.ts';
import '@/ai/flows/chat-flow.ts';
import '@/ai/flows/generate-summary-image.ts';
