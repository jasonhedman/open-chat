import { SpotifyTools } from "./tools";
import { createClientToolkit } from "@/toolkits/create-toolkit";
import { SiSpotify } from "@icons-pack/react-simple-icons";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ToolkitGroups } from "@/toolkits/types";
import { Toolkits } from "../shared";
import { baseSpotifyToolkitConfig } from "./base";
import { getPlaylistsToolConfigClient } from "./tools/get-playlists/client";


  export const spotifyClientToolkit = createClientToolkit(
    baseSpotifyToolkitConfig,
    {
      name: "Spotify",
      description: "Interact with your Spotify account and playlists.",
      icon: SiSpotify,
      form: null,
      addToolkitWrapper: ({ children }) => {
        const { data: hasAccount, isLoading } =
          api.accounts.hasProviderAccount.useQuery("spotify");

        if (isLoading) {
          return (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="bg-transparent"
            >
              <Loader2 className="size-4 animate-spin" />
            </Button>
          );
        }

        if (!hasAccount) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void signIn("spotify", {
                  callbackUrl: `${window.location.href}?${Toolkits.Spotify}=true`,
                });
              }}
              className="bg-transparent"
            >
              Connect
            </Button>
          );
        }

        return children;
      },
      type: ToolkitGroups.DataSource,
    },
    {
      [SpotifyTools.GetPlaylists]: getPlaylistsToolConfigClient,
    },
  );
