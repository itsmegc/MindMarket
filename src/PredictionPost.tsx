import { Devvit, useState, useAsync, useChannel, Context } from '@devvit/public-api';
import {
  getPrediction,
  getUserVote,
  saveUserVote,
  saveVoterToList,
  savePrediction,
} from './redis.js';

type VoteUpdate = {
  votesA: number;
  votesB: number;
  totalVotes: number;
};

// All fields must be JSONValue-compatible for useAsync
type LoadedState = {
  votesA: number;
  votesB: number;
  totalVotes: number;
  status: string;
  winner: string | null;
  question: string;
  optionA: string;
  optionB: string;
  expiresAt: number;
  subredditName: string;
  username: string | null;
  vote: string | null;
};

export function PredictionPost(context: Context): JSX.Element {
  const postId = context.postId ?? '';

  // --- mutable state (updated by realtime / vote actions) ---
  const [votesA, setVotesA] = useState(0);
  const [votesB, setVotesB] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  const [status, setStatus] = useState<'active' | 'resolved' | 'expired'>('active');
  const [winner, setWinner] = useState<'A' | 'B' | null>(null);
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('Yes');
  const [optionB, setOptionB] = useState('No');
  const [expiresAt, setExpiresAt] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // --- initial data load ---
  // IMPORTANT: setState calls are NOT allowed inside the useAsync body.
  // All state updates must happen in the `finally` callback.
  useAsync(
    async () => {
      const [pred, user] = await Promise.all([
        getPrediction(context.kvStore, postId),
        context.reddit.getCurrentUser(),
      ]);

      let vote: string | null = null;
      if (user && pred) {
        vote = await getUserVote(context.kvStore, postId, user.username);
      }

      return {
        votesA: pred?.votesA ?? 0,
        votesB: pred?.votesB ?? 0,
        totalVotes: pred?.totalVotes ?? 0,
        status: pred?.status ?? 'active',
        winner: pred?.winner ?? null,
        question: pred?.question ?? '(no question)',
        optionA: pred?.optionA ?? 'Yes',
        optionB: pred?.optionB ?? 'No',
        expiresAt: pred?.expiresAt ?? 0,
        subredditName: pred?.subredditName ?? '',
        username: user?.username ?? null,
        vote,
      } as LoadedState;
    },
    {
      finally: (data, error) => {
        if (error) {
          console.error('PredictionPost load error:', error);
          setLoaded(true);
          return;
        }
        if (!data) {
          setLoaded(true);
          return;
        }
        setVotesA(data.votesA);
        setVotesB(data.votesB);
        setTotalVotes(data.totalVotes);
        setStatus(data.status as 'active' | 'resolved' | 'expired');
        setWinner(data.winner as 'A' | 'B' | null);
        setQuestion(data.question);
        setOptionA(data.optionA);
        setOptionB(data.optionB);
        setExpiresAt(data.expiresAt);
        setUsername(data.username);
        setUserVote(data.vote as 'A' | 'B' | null);
        setLoaded(true);
      },
    }
  );

  // --- realtime subscription ---
  const channel = useChannel<VoteUpdate>({
    name: `prediction:${postId}`,
    onMessage: (data) => {
      setVotesA(data.votesA);
      setVotesB(data.votesB);
      setTotalVotes(data.totalVotes);
    },
  });
  channel.subscribe();

  // --- derived values ---
  const pctA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  function getExpiryText(): string {
    if (status === 'resolved') return 'Resolved';
    if (status === 'expired') return 'Expired';
    if (expiresAt === 0) return '';
    const days = Math.ceil((expiresAt - Date.now()) / 86_400_000);
    if (days <= 0) return 'Expired';
    return days === 1 ? '1 day left' : `${days} days left`;
  }

  // --- vote handler (setState calls from event handlers are allowed) ---
  async function handleVote(option: 'A' | 'B'): Promise<void> {
    if (!username || userVote !== null || status !== 'active') return;

    const newVotesA = option === 'A' ? votesA + 1 : votesA;
    const newVotesB = option === 'B' ? votesB + 1 : votesB;
    const newTotal = totalVotes + 1;

    setVotesA(newVotesA);
    setVotesB(newVotesB);
    setTotalVotes(newTotal);
    setUserVote(option);

    await saveUserVote(context.kvStore, postId, username, option);
    await saveVoterToList(context.kvStore, postId, username);

    const pred = await getPrediction(context.kvStore, postId);
    if (pred) {
      pred.votesA = newVotesA;
      pred.votesB = newVotesB;
      pred.totalVotes = newTotal;
      await savePrediction(context.kvStore, postId, pred);
    }

    await channel.send({ votesA: newVotesA, votesB: newVotesB, totalVotes: newTotal });
  }

  // --- loading state ---
  if (!loaded) {
    return (
      <vstack grow alignment="center middle">
        <text>Loading prediction...</text>
      </vstack>
    );
  }

  // --- main render ---
  return (
    <vstack padding="medium" gap="medium" grow>
      {/* Header */}
      <hstack alignment="middle" gap="small">
        <text weight="bold" size="small">MindMarket</text>
        <spacer grow />
        <text size="xsmall" color="neutral-content-weak">{getExpiryText()}</text>
      </hstack>

      {/* Status banner */}
      {status === 'resolved' && (
        <hstack
          backgroundColor="success-background"
          padding="small"
          cornerRadius="small"
          alignment="center middle"
        >
          <text color="success-content" weight="bold" size="small">
            Resolved — Option {winner} wins!
          </text>
        </hstack>
      )}
      {status === 'expired' && (
        <hstack
          backgroundColor="neutral-background"
          padding="small"
          cornerRadius="small"
          alignment="center middle"
        >
          <text color="neutral-content-weak" size="small">
            Prediction expired — no winner
          </text>
        </hstack>
      )}

      {/* Question */}
      <vstack alignment="center middle">
        <text size="large" weight="bold" alignment="center" wrap>
          {question}
        </text>
      </vstack>

      {/* Vote columns */}
      <hstack gap="medium" grow>
        {/* Option A */}
        <vstack grow gap="small" alignment="center middle">
          <text weight="bold" size="medium">{optionA}</text>
          <text size="xxlarge" weight="bold">{String(votesA)}</text>
          <hstack width="100%" height="8px" backgroundColor="neutral-background" cornerRadius="full">
            <vstack
              width={`${pctA}%`}
              height="8px"
              backgroundColor={userVote === 'A' ? 'upvote' : 'neutral-content'}
              cornerRadius="full"
            />
          </hstack>
          <text size="small" color="neutral-content">{String(pctA)}%</text>
          <button
            onPress={() => handleVote('A')}
            disabled={status !== 'active' || userVote !== null}
            appearance={userVote === 'A' ? 'primary' : 'secondary'}
            size="small"
          >
            {userVote === 'A' ? '✓ Voted' : 'Vote A'}
          </button>
        </vstack>

        <vstack width="1px" backgroundColor="neutral-border" />

        {/* Option B */}
        <vstack grow gap="small" alignment="center middle">
          <text weight="bold" size="medium">{optionB}</text>
          <text size="xxlarge" weight="bold">{String(votesB)}</text>
          <hstack width="100%" height="8px" backgroundColor="neutral-background" cornerRadius="full">
            <vstack
              width={`${pctB}%`}
              height="8px"
              backgroundColor={userVote === 'B' ? 'upvote' : 'neutral-content'}
              cornerRadius="full"
            />
          </hstack>
          <text size="small" color="neutral-content">{String(pctB)}%</text>
          <button
            onPress={() => handleVote('B')}
            disabled={status !== 'active' || userVote !== null}
            appearance={userVote === 'B' ? 'primary' : 'secondary'}
            size="small"
          >
            {userVote === 'B' ? '✓ Voted' : 'Vote B'}
          </button>
        </vstack>
      </hstack>

      {/* Footer */}
      <vstack alignment="center middle" gap="small">
       <text size="xsmall" color="neutral-content-weak">
          Total voters: {String(totalVotes)}
        </text>
        {userVote !== null && status === 'active' && (
          <text size="xsmall" color="interactive-content">
            You voted: Option {userVote}
          </text>
        )}
      </vstack>
    </vstack>
  );
}
