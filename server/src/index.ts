
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createKanjiInputSchema, 
  createExampleUsageInputSchema,
  updateUserProgressInputSchema,
  getFlashcardsInputSchema,
  getUserProgressInputSchema
} from './schema';

import { createKanji } from './handlers/create_kanji';
import { createExampleUsage } from './handlers/create_example_usage';
import { getFlashcards } from './handlers/get_flashcards';
import { updateUserProgress } from './handlers/update_user_progress';
import { getUserProgress } from './handlers/get_user_progress';
import { getAllKanji } from './handlers/get_all_kanji';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Kanji management
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),
    
  getAllKanji: publicProcedure
    .query(() => getAllKanji()),
  
  // Example usage management
  createExampleUsage: publicProcedure
    .input(createExampleUsageInputSchema)
    .mutation(({ input }) => createExampleUsage(input)),
  
  // Flashcard learning system
  getFlashcards: publicProcedure
    .input(getFlashcardsInputSchema)
    .query(({ input }) => getFlashcards(input)),
  
  // User progress tracking
  updateUserProgress: publicProcedure
    .input(updateUserProgressInputSchema)
    .mutation(({ input }) => updateUserProgress(input)),
    
  getUserProgress: publicProcedure
    .input(getUserProgressInputSchema)
    .query(({ input }) => getUserProgress(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Kanji Learning TRPC server listening at port: ${port}`);
}

start();
