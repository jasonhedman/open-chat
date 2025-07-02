// src/toolkits/toolkits/spotify/tools/get-playlists/base.ts
//TODO: Implement the actual base tool for the GetPlaylists tool
import { z } from "zod";
import { createBaseTool } from "@/toolkits/create-tool";

export const getPlaylistsBase = createBaseTool({
  description: "Get the user's Spotify playlists.",
  inputSchema: z.object({
    limit: z.number().min(1).max(50).optional().describe("The maximum number of items to return. Default: 20. Min: 1. Max: 50."),
    offset: z.number().min(0).optional().describe("The index of the first playlist to return. Default: 0."),
  }),
  outputSchema: z.object({
    playlists: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        image: z.string().url().optional(),
        description: z.string(),
        public: z.boolean(),
        collaborative: z.boolean(),
        owner: z.object({
          id: z.string(),
          display_name: z.string().optional(),
        }),
        tracks: z.object({
          total: z.number(),
        }),
        snapshot_id: z.string(),
        uri: z.string(),
        type: z.string(),
        images: z.array(
          z.object({
            url: z.string().url(),
            height: z.number().nullable(),
            width: z.number().nullable(),
          })
        ),
      })
    ),
  }),
});