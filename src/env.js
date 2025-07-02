import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const createAuthSchema = () => {
  const authSchema = {};

  if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
    authSchema.AUTH_DISCORD_ID = z.string();
    authSchema.AUTH_DISCORD_SECRET = z.string();
  }

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    authSchema.AUTH_GOOGLE_ID = z.string();
    authSchema.AUTH_GOOGLE_SECRET = z.string();
  }

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    authSchema.AUTH_GITHUB_ID = z.string();
    authSchema.AUTH_GITHUB_SECRET = z.string();
  }

  if (process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET) {
    authSchema.AUTH_TWITTER_ID = z.string();
    authSchema.AUTH_TWITTER_SECRET = z.string();
  }

  if (process.env.AUTH_NOTION_ID && process.env.AUTH_NOTION_SECRET) {
    authSchema.AUTH_NOTION_ID = z.string();
    authSchema.AUTH_NOTION_SECRET = z.string();
  }

  if (process.env.AUTH_SPOTIFY_ID && process.env.AUTH_SPOTIFY_SECRET) {
    authSchema.AUTH_SPOTIFY_ID = z.string();
    authSchema.AUTH_SPOTIFY_SECRET = z.string();
  }

  if (Object.keys(authSchema).length === 0) {
    throw new Error("No authentication provider configured");
  }

  return authSchema;
};

const authRuntimeEnv = () => {
  const object = {};

  if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
    object.AUTH_DISCORD_ID = process.env.AUTH_DISCORD_ID;
    object.AUTH_DISCORD_SECRET = process.env.AUTH_DISCORD_SECRET;
  }

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    object.AUTH_GOOGLE_ID = process.env.AUTH_GOOGLE_ID;
    object.AUTH_GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET;
  }

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    object.AUTH_GITHUB_ID = process.env.AUTH_GITHUB_ID;
    object.AUTH_GITHUB_SECRET = process.env.AUTH_GITHUB_SECRET;
  }

  if (process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET) {
    object.AUTH_TWITTER_ID = process.env.AUTH_TWITTER_ID;
    object.AUTH_TWITTER_SECRET = process.env.AUTH_TWITTER_SECRET;
  }

  if (process.env.AUTH_NOTION_ID && process.env.AUTH_NOTION_SECRET) {
    object.AUTH_NOTION_ID = process.env.AUTH_NOTION_ID;
    object.AUTH_NOTION_SECRET = process.env.AUTH_NOTION_SECRET;
  }

  if (process.env.AUTH_SPOTIFY_ID && process.env.AUTH_SPOTIFY_SECRET) {
    object.AUTH_SPOTIFY_ID = process.env.AUTH_SPOTIFY_ID;
    object.AUTH_SPOTIFY_SECRET = process.env.AUTH_SPOTIFY_SECRET;
  }

  return object;
};

const createImageModelSchema = () => {
  const imageModelSchema = {};

  if (process.env.OPENAI_API_KEY) {
    imageModelSchema.OPENAI_API_KEY = z.string();
  }

  if (process.env.XAI_API_KEY) {
    imageModelSchema.XAI_API_KEY = z.string();
  }

  return imageModelSchema;
};

const imageModelRuntimeEnv = () => {
  const object = {};

  if (process.env.OPENAI_API_KEY) {
    object.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }

  if (process.env.XAI_API_KEY) {
    object.XAI_API_KEY = process.env.XAI_API_KEY;
  }

  return object;
};

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    APP_URL: z.string().url(),
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OPENROUTER_API_KEY: z.string(),
    EXA_API_KEY: z.string().optional(),
    MEM0_API_KEY: z.string().optional(),
    E2B_API_KEY: z.string().optional(),
    ...createAuthSchema(),
    ...createImageModelSchema(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    APP_URL: process.env.APP_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    EXA_API_KEY: process.env.EXA_API_KEY,
    MEM0_API_KEY: process.env.MEM0_API_KEY,
    E2B_API_KEY: process.env.E2B_API_KEY,
    ...authRuntimeEnv(),
    ...imageModelRuntimeEnv(),
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
