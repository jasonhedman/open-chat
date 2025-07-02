import type { ServerToolkit } from "../types";
import { exaToolkitServer } from "./exa/server";
import { githubToolkitServer } from "./github/server";
import { googleCalendarToolkitServer } from "./google-calendar/server";
import { googleDriveToolkitServer } from "./google-drive/server";
import { imageToolkitServer } from "./image/server";
import { mem0ToolkitServer } from "./mem0/server";
import { notionToolkitServer } from "./notion/server";
import { e2bToolkitServer } from "./e2b/server";
import {
  Toolkits,
  type ServerToolkitNames,
  type ServerToolkitParameters,
} from "./shared";
import { spotifyToolkitServer } from "./spotify/server";

type ServerToolkits = {
  [K in Toolkits]: ServerToolkit<
    ServerToolkitNames[K],
    ServerToolkitParameters[K]
  >;
};

export const serverToolkits: ServerToolkits = {
  [Toolkits.Exa]: exaToolkitServer,
  [Toolkits.Image]: imageToolkitServer,
  [Toolkits.Github]: githubToolkitServer,
  [Toolkits.GoogleCalendar]: googleCalendarToolkitServer,
  [Toolkits.GoogleDrive]: googleDriveToolkitServer,
  [Toolkits.Memory]: mem0ToolkitServer,
  [Toolkits.Notion]: notionToolkitServer,
  [Toolkits.E2B]: e2bToolkitServer,
  [Toolkits.Spotify] : spotifyToolkitServer
};

export function getServerToolkit<T extends Toolkits>(
  server: T,
): ServerToolkit<ServerToolkitNames[T], ServerToolkitParameters[T]> {
  return serverToolkits[server];
}
