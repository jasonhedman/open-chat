import { createContext, useContext, useEffect, useState } from "react";

import { useChat } from "@ai-sdk/react";

import { toast } from "sonner";

import { api } from "@/trpc/react";

import { generateUUID } from "@/lib/utils";
import { fetchWithErrorHandlers } from "@/lib/fetch";
import { ChatSDKError } from "@/lib/errors";

import { useAutoResume } from "../_hooks/use-auto-resume";

import type { ReactNode } from "react";
import type { Attachment, UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import {
  LanguageModelCapability,
  type ImageModel,
  type LanguageModel,
} from "@/ai/types";
import type { ClientToolkit } from "@/mcp/types";
import type { z, ZodRawShape } from "zod";

interface ChatContextType {
  // Chat state
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  input: string;
  setInput: UseChatHelpers["setInput"];
  status: UseChatHelpers["status"];
  attachments: Array<Attachment>;
  setAttachments: (
    attachments:
      | Array<Attachment>
      | ((prev: Array<Attachment>) => Array<Attachment>),
  ) => void;
  selectedChatModel: LanguageModel | undefined;
  setSelectedChatModel: (model: LanguageModel) => void;
  useNativeSearch: boolean;
  setUseNativeSearch: (enabled: boolean) => void;
  imageGenerationModel: ImageModel | undefined;
  setImageGenerationModel: (model: ImageModel | undefined) => void;

  toolkits: Array<{
    id: string;
    toolkit: ClientToolkit;
    parameters: z.infer<ClientToolkit["parameters"]>;
  }>;
  addToolkit: (
    id: string,
    toolkit: ClientToolkit,
    parameters: z.infer<ClientToolkit["parameters"]>,
  ) => void;
  removeToolkit: (id: string) => void;

  // Chat actions
  handleSubmit: UseChatHelpers["handleSubmit"];
  stop: () => void;
  reload: UseChatHelpers["reload"];
  append: UseChatHelpers["append"];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  id: string;
  initialMessages: Array<UIMessage>;
  initialVisibilityType: "public" | "private";
  autoResume: boolean;
}

export function ChatProvider({
  children,
  id,
  initialMessages,
  initialVisibilityType,
  autoResume,
}: ChatProviderProps) {
  const utils = api.useUtils();
  const [selectedChatModel, setSelectedChatModel] = useState<LanguageModel>();
  const [useNativeSearch, setUseNativeSearch] = useState(false);
  const [imageGenerationModel, setImageGenerationModel] = useState<
    ImageModel | undefined
  >(undefined);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [toolkits, setToolkits] = useState<
    Array<{
      id: string;
      toolkit: ClientToolkit;
      parameters: z.infer<ClientToolkit["parameters"]>;
    }>
  >([]);

  const addToolkit = (
    id: string,
    toolkit: ClientToolkit,
    parameters: z.infer<ClientToolkit["parameters"]>,
  ) => {
    setToolkits((prev) => [
      ...prev.filter((t) => t.id !== id),
      { id, toolkit, parameters },
    ]);
  };

  const removeToolkit = (id: string) => {
    setToolkits((prev) => prev.filter((t) => t.id !== id));
  };

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: `${selectedChatModel?.provider}:${selectedChatModel?.modelId}`,
      imageGenerationModel: imageGenerationModel
        ? `${imageGenerationModel.provider}:${imageGenerationModel.modelId}`
        : undefined,
      selectedVisibilityType: initialVisibilityType,
      useNativeSearch,
      toolkits: toolkits.map((t) => ({
        id: t.id,
        parameters: t.parameters,
      })),
    }),
    onFinish: () => {
      void utils.messages.getMessagesForChat.invalidate({ chatId: id });
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast.error(error.message);
      } else {
        console.error(error);
        toast.error("An error occurred while processing your request");
      }
    },
  });

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  useEffect(() => {
    if (
      selectedChatModel?.capabilities?.includes(
        LanguageModelCapability.WebSearch,
      )
    ) {
      setUseNativeSearch(true);
    } else {
      setUseNativeSearch(false);
    }
  }, [selectedChatModel]);

  const value = {
    messages,
    setMessages,
    input,
    setInput,
    status,
    attachments,
    setAttachments,
    selectedChatModel,
    setSelectedChatModel,
    useNativeSearch,
    setUseNativeSearch,
    handleSubmit,
    stop,
    reload,
    append,
    imageGenerationModel,
    setImageGenerationModel,
    toolkits,
    addToolkit,
    removeToolkit,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
