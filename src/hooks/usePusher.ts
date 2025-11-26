"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { env } from "~/env";

let pusherClient: Pusher | null = null;

export function usePusher() {
  useEffect(() => {
    if (!pusherClient && env.NEXT_PUBLIC_PUSHER_KEY && env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      pusherClient = new Pusher(env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });
    }

    return () => {
      if (pusherClient) {
        pusherClient.disconnect();
      }
    };
  }, []);

  return pusherClient;
}
