import { KVStore } from '@devvit/public-api';

export type PredictionData = {
  question: string;
  optionA: string;
  optionB: string;
  expiresAt: number;
  status: 'active' | 'resolved' | 'expired';
  winner: 'A' | 'B' | null;
  votesA: number;
  votesB: number;
  totalVotes: number;
  postId: string;
  subredditName: string;
};

export type LeaderboardEntry = {
  username: string;
  points: number;
  correct: number;
  total: number;
};

export async function getPrediction(
  kvStore: KVStore,
  postId: string
): Promise<PredictionData | null> {
  const data = await kvStore.get<string>(`prediction:${postId}`);
  if (!data) return null;
  return JSON.parse(data) as PredictionData;
}

export async function savePrediction(
  kvStore: KVStore,
  postId: string,
  data: PredictionData
): Promise<void> {
  await kvStore.put(`prediction:${postId}`, JSON.stringify(data));
}

export async function getUserVote(
  kvStore: KVStore,
  postId: string,
  username: string
): Promise<'A' | 'B' | null> {
  const data = await kvStore.get<string>(`vote:${postId}:${username}`);
  if (!data) return null;
  return data as 'A' | 'B';
}

export async function saveUserVote(
  kvStore: KVStore,
  postId: string,
  username: string,
  option: 'A' | 'B'
): Promise<void> {
  await kvStore.put(`vote:${postId}:${username}`, option);
}

export async function getLeaderboard(
  kvStore: KVStore,
  subredditName: string
): Promise<LeaderboardEntry[]> {
  const data = await kvStore.get<string>(`leaderboard:${subredditName}`);
  if (!data) return [];
  return JSON.parse(data) as LeaderboardEntry[];
}

export async function updateLeaderboard(
  kvStore: KVStore,
  subredditName: string,
  username: string,
  isCorrect: boolean
): Promise<void> {
  const leaderboard = await getLeaderboard(kvStore, subredditName);
  const idx = leaderboard.findIndex((e) => e.username === username);

  if (idx >= 0) {
    leaderboard[idx].total += 1;
    if (isCorrect) {
      leaderboard[idx].correct += 1;
      leaderboard[idx].points += 10;
    }
  } else {
    leaderboard.push({
      username,
      points: isCorrect ? 10 : 0,
      correct: isCorrect ? 1 : 0,
      total: 1,
    });
  }

  await kvStore.put(`leaderboard:${subredditName}`, JSON.stringify(leaderboard));
}

export async function getAllActivePredictionIds(kvStore: KVStore): Promise<string[]> {
  const data = await kvStore.get<string>('active_predictions');
  if (!data) return [];
  return JSON.parse(data) as string[];
}

export async function addActivePredictionId(kvStore: KVStore, postId: string): Promise<void> {
  const ids = await getAllActivePredictionIds(kvStore);
  if (!ids.includes(postId)) {
    ids.push(postId);
    await kvStore.put('active_predictions', JSON.stringify(ids));
  }
}

export async function saveVoterToList(
  kvStore: KVStore,
  postId: string,
  username: string
): Promise<void> {
  const data = await kvStore.get<string>(`voters:${postId}`);
  const voters: string[] = data ? (JSON.parse(data) as string[]) : [];
  if (!voters.includes(username)) {
    voters.push(username);
    await kvStore.put(`voters:${postId}`, JSON.stringify(voters));
  }
}

export async function getVoterList(kvStore: KVStore, postId: string): Promise<string[]> {
  const data = await kvStore.get<string>(`voters:${postId}`);
  if (!data) return [];
  return JSON.parse(data) as string[];
}
