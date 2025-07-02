import React from "react";
import type { ClientToolConfig } from "@/toolkits/types";
import type { getPlaylistsBase } from "./base";
import { Music } from "lucide-react";
import { ToolCallDisplay } from "../../components";

export const getPlaylistsToolConfigClient: ClientToolConfig<
  typeof getPlaylistsBase.inputSchema.shape,
  typeof getPlaylistsBase.outputSchema.shape
> = {
  CallComponent: ({ args }) => {
    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;
    
    return (
      <ToolCallDisplay
        icon={Music}
        label="Get Playlists"
        value={`Fetching ${limit} playlists (offset: ${offset})...`}
      />
    );
  },
  ResultComponent: ({ result, append }) => {
    if (!result.playlists.length) {
      return <div className="text-muted-foreground">No playlists found</div>;
    }

    return (
      <div className="">
        <h1 className="text-muted-foreground text-sm font-medium">
          Your Spotify Playlists
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {result.playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => {
                void append({
                  role: "user",
                  content: `Tell me more about the playlist "${playlist.name}"`,
                });
              }}
            >
              <div className="flex items-center space-x-3">
                {playlist.image ? (
                  <img
                    src={playlist.image}
                    alt={playlist.name}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{playlist.name}</h3>
                  <a
                    href={playlist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open in Spotify
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
}; 