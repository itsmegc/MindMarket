import { Devvit } from '@devvit/public-api';
import { registerCreatePrediction } from './createPrediction.js';
import { registerResolvePrediction } from './resolvePrediction.js';
import { registerScheduler } from './scheduler.js';
import { registerLeaderboard, LeaderboardPost } from './Leaderboard.js';
import { PredictionPost } from './PredictionPost.js';

// --- Global configuration ---
Devvit.configure({
  redditAPI: true,
  kvStore: true,
  realtime: true,
});

// --- Custom post types ---
Devvit.addCustomPostType({
  name: 'mindmarket-prediction',
  render: PredictionPost,
});

Devvit.addCustomPostType({
  name: 'mindmarket-leaderboard',
  render: LeaderboardPost,
});

// --- Register all features ---
registerCreatePrediction();
registerResolvePrediction();
registerScheduler();
registerLeaderboard();

export default Devvit;
