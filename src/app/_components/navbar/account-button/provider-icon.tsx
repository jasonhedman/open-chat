import Image from "next/image";

import { cn } from "@/lib/utils";
import { SiGithub, SiNotion,SiSpotify, SiX } from "@icons-pack/react-simple-icons";

interface Props {
  provider: string;
  className?: string;
}

export const AuthProviderIcon: React.FC<Props> = ({ provider, className }) => {
  const Icon =
    {
      Discord: ({ className }: { className?: string }) => (
        <Image
          src="/icons/discord.png"
          alt="Discord"
          className={className}
          width={16}
          height={16}
        />
      ),
      Google: ({ className }: { className?: string }) => (
        <Image
          src="/icons/google.png"
          alt="Google"
          className={className}
          width={16}
          height={16}
        />
      ),
      GitHub: SiGithub,
      Twitter: SiX,
      Notion: SiNotion,
      Spotify: SiSpotify,
    }[provider] ?? null;

  return Icon ? <Icon className={cn("size-4", className)} /> : null;
};
