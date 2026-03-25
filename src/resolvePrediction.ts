import { Devvit } from '@devvit/public-api';
import {
  getPrediction,
  savePrediction,
  getUserVote,
  updateLeaderboard,
  getVoterList,
} from './redis.js';

const resolveForm = Devvit.createForm(
  {
    title: 'Resolve Prediction',
    acceptLabel: 'Resolve',
    fields: [
      {
        type: 'select',
        name: 'winner',
        label: 'Which option won?',
        required: true,
        multiSelect: false,
        options: [
          { label: 'Option A', value: 'A' },
          { label: 'Option B', value: 'B' },
        ],
      },
    ],
  },
  async (event, context) => {
    const postId = context.postId;
    if (!postId) {
      context.ui.showToast('Could not find post.');
      return;
    }

    const prediction = await getPrediction(context.kvStore, postId);
    if (!prediction) {
      context.ui.showToast('Prediction not found.');
      return;
    }
    if (prediction.status !== 'active') {
      context.ui.showToast('This prediction is already resolved or expired.');
      return;
    }

    // event.values.winner is string[] for select fields
    const rawWinner = event.values.winner;
    const winner = (Array.isArray(rawWinner) ? rawWinner[0] : rawWinner) as 'A' | 'B';

    prediction.status = 'resolved';
    prediction.winner = winner;
    await savePrediction(context.kvStore, postId, prediction);

    const voters = await getVoterList(context.kvStore, postId);
    for (const username of voters) {
      const vote = await getUserVote(context.kvStore, postId, username);
      if (vote !== null) {
        await updateLeaderboard(
          context.kvStore,
          prediction.subredditName,
          username,
          vote === winner
        );
      }
    }

    context.ui.showToast('Prediction resolved!');
  }
);

export function registerResolvePrediction(): void {
  Devvit.addMenuItem({
    label: 'Resolve Prediction',
    location: 'post',
    forUserType: 'moderator',
    onPress: async (_event, context) => {
      const postId = context.postId;
      if (!postId) {
        context.ui.showToast('No post context found.');
        return;
      }

      const prediction = await getPrediction(context.kvStore, postId);
      if (!prediction) {
        context.ui.showToast('No prediction found for this post.');
        return;
      }
      if (prediction.status !== 'active') {
        context.ui.showToast('This prediction is already resolved or expired.');
        return;
      }

      context.ui.showForm(resolveForm);
    },
  });
}
