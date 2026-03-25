import { Devvit } from '@devvit/public-api';
import { savePrediction, addActivePredictionId, PredictionData } from './redis.js';

const createPredictionForm = Devvit.createForm(
  {
    title: 'Create a Prediction',
    acceptLabel: 'Create',
    fields: [
      {
        type: 'string',
        name: 'question',
        label: 'Prediction question',
        required: true,
      },
      {
        type: 'string',
        name: 'optionA',
        label: 'Option A',
        required: true,
        defaultValue: 'Yes',
      },
      {
        type: 'string',
        name: 'optionB',
        label: 'Option B',
        required: true,
        defaultValue: 'No',
      },
      {
        type: 'number',
        name: 'daysUntilExpiry',
        label: 'Expires in (days)',
        required: true,
        defaultValue: 7,
      },
    ],
  },
  async (event, context) => {
    const { question, optionA, optionB, daysUntilExpiry } = event.values;

    if (!question || !optionA || !optionB || daysUntilExpiry == null) {
      context.ui.showToast('Please fill in all fields.');
      return;
    }

    const expiresAt = Date.now() + Number(daysUntilExpiry) * 86_400_000;
    const subredditName = context.subredditName ?? '';

    const post = await context.reddit.submitPost({
      title: String(question),
      subredditName,
      preview: (
        <vstack grow alignment="center middle">
          <text>Loading MindMarket prediction...</text>
        </vstack>
      ),
    });

    const postId = post.id;

    const predictionData: PredictionData = {
      question: String(question),
      optionA: String(optionA),
      optionB: String(optionB),
      expiresAt,
      status: 'active',
      winner: null,
      votesA: 0,
      votesB: 0,
      totalVotes: 0,
      postId,
      subredditName,
    };

    await savePrediction(context.kvStore, postId, predictionData);
    await addActivePredictionId(context.kvStore, postId);

    context.ui.showToast('Prediction created!');
  }
);

export function registerCreatePrediction(): void {
  Devvit.addMenuItem({
    label: 'Create Prediction',
    location: 'subreddit',
    forUserType: 'moderator',
    onPress: (_event, context) => {
      context.ui.showForm(createPredictionForm);
    },
  });
}
