import type { QueryClient } from "@tanstack/react-query";

export const collectionKeys = {
  user: (uid: string) => ["userCollection", uid] as const,
  statusPrefix: (uid: string) => ["collectionStatus", uid] as const,
  publicCollection: (uid: string) => ["publicCollection", uid] as const,
  recommendations: ["recommendations"] as const,
  recommendationsV2: ["recommendations-v2"] as const,
  devices: (uid: string) => ["userDevices", uid] as const,
  settings: (uid: string) => ["userSettings", uid] as const,
  publicSettings: (uid: string) => ["publicSettings", uid] as const,
};

export const invalidateUserLibrary = async (queryClient: QueryClient, uid: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: collectionKeys.user(uid) }),
    queryClient.invalidateQueries({ queryKey: collectionKeys.statusPrefix(uid) }),
    queryClient.invalidateQueries({ queryKey: collectionKeys.publicCollection(uid) }),
    queryClient.invalidateQueries({ queryKey: collectionKeys.recommendations }),
    queryClient.invalidateQueries({ queryKey: collectionKeys.recommendationsV2 }),
  ]);
};
