import { Devvit, useAsync, Context } from '@devvit/public-api';
import { getLeaderboard, LeaderboardEntry } from './redis.js';

// --- Leaderboard custom post UI ---

export function LeaderboardPost(context: Context): JSX.Element {
  const subredditName = context.subredditName ?? '';

  const { data: entries } = useAsync<LeaderboardEntry[]>(async () => {
    const data = await getLeaderboard(context.kvStore, subredditName);
    return data.sort((a, b) => b.points - a.points).slice(0, 10);
  });

  const rows = entries ?? [];

  return (
    <vstack padding="medium" gap="medium" grow>
      {/* Title */}
      <hstack alignment="center middle">
        <text weight="bold" size="xlarge">
          MindMarket Leaderboard
        </text>
      </hstack>

      <hstack gap="small">
        <text size="xsmall" color="neutral-content-weak" width="10%">
          Rank
        </text>
        <text size="xsmall" color="neutral-content-weak" grow>
          User
        </text>
        <text size="xsmall" color="neutral-content-weak" width="20%">
          Points
        </text>
        <text size="xsmall" color="neutral-content-weak" width="25%">
          Record
        </text>
        <text size="xsmall" color="neutral-content-weak" width="20%">
          Accuracy
        </text>
      </hstack>

      {rows.length === 0 ? (
        <vstack grow alignment="center middle">
          <text color="neutral-content-weak">No predictions resolved yet</text>
        </vstack>
      ) : (
        <vstack gap="small">
          {rows.map((entry, i) => {
            const accuracy =
              entry.total > 0 ? `${Math.round((entry.correct / entry.total) * 100)}%` : '—';
            const rank = `#${i + 1}`;
            return (
              <hstack
                key={entry.username}
                gap="small"
                padding="xsmall"
                backgroundColor={i === 0 ? 'upvote-background' : 'transparent'}
                cornerRadius="small"
                alignment="middle"
              >
                <text size="small" weight={i < 3 ? 'bold' : 'regular'} width="10%">
                  {rank}
                </text>
                <text size="small" grow>
                  u/{entry.username}
                </text>
                <text size="small" weight="bold" width="20%">
                  {String(entry.points)} pts
                </text>
                <text size="small" color="neutral-content" width="25%">
                  {String(entry.correct)}/{String(entry.total)}
                </text>
                <text size="small" color="neutral-content" width="20%">
                  {accuracy}
                </text>
              </hstack>
            );
          })}
        </vstack>
      )}
    </vstack>
  );
}

// --- Menu item to launch leaderboard post ---

export function registerLeaderboard(): void {
  Devvit.addMenuItem({
    label: 'View Leaderboard',
    location: 'subreddit',
    onPress: async (_event, context) => {
      const subredditName = context.subredditName ?? '';
      const entries = await getLeaderboard(context.kvStore, subredditName);

      if (entries.length === 0) {
        context.ui.showToast('No predictions resolved yet — leaderboard is empty.');
        return;
      }

      await context.reddit.submitPost({
        title: 'MindMarket Leaderboard',
        subredditName,
        preview: (
          <vstack grow alignment="center middle">
            <text>Loading leaderboard...</text>
          </vstack>
        ),
      });

      context.ui.showToast('Leaderboard post created!');
    },
  });
}
