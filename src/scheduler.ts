import { Devvit } from '@devvit/public-api';
import { getAllActivePredictionIds, getPrediction, savePrediction } from './redis.js';

export function registerScheduler(): void {
  Devvit.addSchedulerJob({
    name: 'checkExpiredPredictions',
    onRun: async (_event, context) => {
      const kvStore = context.kvStore;
      const ids = await getAllActivePredictionIds(kvStore);
      const now = Date.now();

      for (const postId of ids) {
        const prediction = await getPrediction(kvStore, postId);
        if (!prediction) continue;

        if (prediction.status === 'active' && prediction.expiresAt < now) {
          prediction.status = 'expired';
          await savePrediction(kvStore, postId, prediction);
        }
      }
    },
  });
}
