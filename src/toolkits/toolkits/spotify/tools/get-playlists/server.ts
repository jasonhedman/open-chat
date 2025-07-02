// src/toolkits/toolkits/spotify/tools/get-playlists/server.ts
//TODO: Implement the actual server tool for the GetPlaylists tool
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { ServerToolConfig } from "@/toolkits/types";
import type { getPlaylistsBase } from "./base";

export const getPlaylistsToolConfigServer = (
  spotify: SpotifyApi,
): ServerToolConfig<
  typeof getPlaylistsBase.inputSchema.shape,
  typeof getPlaylistsBase.outputSchema.shape
> => {
  return {
    callback: async ({ offset = 0 }) => {
      try {
        const response = await spotify.playlists.getUsersPlaylists(
          "",
          10,
          offset
        );
        const playlists = response.items.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          url: playlist.external_urls.spotify,
          image: playlist.images?.[0]?.url,
          images: playlist.images,
          description: playlist.description,
          public: playlist.public,
          collaborative: playlist.collaborative,
          owner: {
            id: playlist.owner.id,
            display_name: playlist.owner.display_name,
          },
          tracks: {
            total: playlist.tracks.total,
          },
          snapshot_id: playlist.snapshot_id,
          type: playlist.type,
          uri: playlist.uri,
        }));

        return {
          playlists,
        };
      } catch (error) {
        
        console.log("Spotify API error:", error);
       throw new Error("Failed to fetch playlists from Spotify");
      }
    },
    message:
      "Successfully retrieved playlists from your Spotify account. The user is shown the responses in the UI. Do not reiterate them. If you called this tool because the user asked a question, answer the question.",
  };
};