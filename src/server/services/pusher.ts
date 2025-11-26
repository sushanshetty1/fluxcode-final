import Pusher from "pusher";
import { env } from "~/env";

let pusherInstance: Pusher | null = null;

export function getPusher() {
  if (!pusherInstance && env.PUSHER_APP_ID && env.PUSHER_KEY && env.PUSHER_SECRET && env.PUSHER_CLUSTER) {
    pusherInstance = new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusherInstance;
}

export async function triggerLeaderboardUpdate(contestId: string, data: unknown) {
  const pusher = getPusher();
  if (pusher) {
    await pusher.trigger(`contest-${contestId}`, "leaderboard-update", data);
  }
}

export async function triggerProgressUpdate(userId: string, data: unknown) {
  const pusher = getPusher();
  if (pusher) {
    await pusher.trigger(`user-${userId}`, "progress-update", data);
  }
}

export async function triggerNotification(userId: string, notification: unknown) {
  const pusher = getPusher();
  if (pusher) {
    await pusher.trigger(`user-${userId}`, "notification", notification);
  }
}
