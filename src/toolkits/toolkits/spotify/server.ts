// src/toolkits/toolkits/spotify/server.ts
import { Scopes, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { baseSpotifyToolkitConfig } from "./base";
import { SpotifyTools } from "./tools";
import { createServerToolkit } from "../../create-toolkit";
import { getPlaylistsToolConfigServer } from "./tools/get-playlists/server";
import { api } from "@/trpc/server";
import { env } from "@/env";

export const spotifyToolkitServer = createServerToolkit(
  baseSpotifyToolkitConfig,
  `You have access to the Spotify toolkit for music discovery and playlist management. This toolkit provides:

- **Get Playlists**: Retrieve the user's Spotify playlists with metadata

**Tool Sequencing Workflows:**
1. **Playlist Discovery**: Use Get Playlists to explore the user's music collection
2. **Playlist Analysis**: Retrieve playlists to understand the user's music preferences
3. **Music Recommendations**: Use playlist data to suggest similar music or create new playlists

**Best Practices:**
- Start with Get Playlists to understand the user's music taste
- Use appropriate limits and offsets for pagination when dealing with many playlists
- Consider the user's privacy and only access playlists they've explicitly shared
- Provide context about playlist genres, moods, and themes when analyzing music preferences`,
  async () => {
    const account = await api.accounts.getAccountByProvider("spotify");

    if (!account) {
      throw new Error("No Spotify account found");
    }
    if (!account.access_token) {
      throw new Error("No Spotify access token found");
    }
  //   export interface AccessToken {
  //     access_token: string;
  //     token_type: string;
  //     expires_in: number;
  //     refresh_token: string;
  //     expires?: number;
  // }
    // Create Spotify API instance with user's access token
    const spotify = SpotifyApi.withAccessToken(
      env.AUTH_SPOTIFY_ID,
     {
      access_token: account.access_token,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: account.refresh_token || "",
     },    
    );

    console.log("account",account); 

    return {
      [SpotifyTools.GetPlaylists]: getPlaylistsToolConfigServer(spotify),
    };
  },
);