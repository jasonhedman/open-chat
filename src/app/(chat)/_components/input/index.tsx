"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  useMemo,
} from "react";

import { ArrowUp, Paperclip, Octagon, ArrowDown } from "lucide-react";

import { AnimatePresence, motion } from "motion/react";

import { toast } from "sonner";

import { useLocalStorage, useWindowSize } from "usehooks-ts";

import equal from "fast-deep-equal";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { PreviewAttachment } from "../preview-attachment";

import { cn } from "@/lib/utils";

import { ModelSelect } from "./model-select";
import { useChatContext } from "../../_contexts/chat-context";
import type { Attachment } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { ToolsSelect } from "./tools";
import type { File as DbFile } from "@prisma/client";
import { LanguageModelCapability } from "@/ai/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NativeSearchToggle } from "./native-search-toggle";

interface Props {
  chatId: string;
  isAtBottom: boolean;
  scrollToBottom: () => void;
  className?: string;
}

const PureMultimodalInput: React.FC<Props> = ({
  chatId,
  isAtBottom,
  scrollToBottom,
  className,
}) => {
  const {
    input,
    setInput,
    status,
    stop,
    attachments,
    setAttachments,
    setMessages,
    handleSubmit,
    selectedChatModel,
  } = useChatContext();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "98px";
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    "",
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const supportsImages = selectedChatModel?.capabilities?.includes(
    LanguageModelCapability.Vision,
  );
  const includesImages = attachments.some((attachment) =>
    attachment.contentType?.includes("image"),
  );
  const includesPdf = attachments.some((attachment) =>
    attachment.contentType?.includes("pdf"),
  );
  const supportsPdf = selectedChatModel?.capabilities?.includes(
    LanguageModelCapability.Pdf,
  );

  const submitDisabledString = useMemo(() => {
    if ((includesImages && !supportsImages) || (includesPdf && !supportsPdf)) {
      return "This model does not support images or PDFs. Please remove your attachments or select a different model.";
    }
    if (includesImages && !supportsImages) {
      return "This model does not support images. Please remove your image attachments or select a different model.";
    }
    if (includesPdf && !supportsPdf) {
      return "This model does not support PDFs. Please remove your PDF attachments or select a different model.";
    }
    return "";
  }, [includesImages, includesPdf, supportsImages, supportsPdf]);

  const submitForm = useCallback(() => {
    if (!selectedChatModel) {
      toast.error("Please select a model");
      return;
    }

    if (submitDisabledString) {
      toast.error(submitDisabledString);
      return;
    }

    window.history.replaceState({}, "", `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput("");
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    selectedChatModel,
    submitDisabledString,
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = (await response.json()) as DbFile;

        const { url, name, contentType } = data;

        return {
          url,
          name,
          contentType,
        };
      }
      const { error } = (await response.json()) as { error: string };
      toast.error(error);
      return undefined;
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file, please try again!");
      return undefined;
    }
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment => attachment !== undefined,
        );

        setAttachments((currentAttachments: Attachment[]) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  useEffect(() => {
    if (status === "submitted") {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  const removeAttachment = useCallback(
    (attachmentToRemove: Attachment) => {
      setAttachments((currentAttachments: Attachment[]) =>
        currentAttachments.filter(
          (attachment) => attachment.url !== attachmentToRemove.url,
        ),
      );
    },
    [setAttachments],
  );

  const acceptedFileTypes = useMemo(() => {
    let acceptedFileTypes: string[] = [];

    if (supportsPdf) {
      acceptedFileTypes = acceptedFileTypes.concat("application/pdf");
    }

    if (supportsImages) {
      acceptedFileTypes = acceptedFileTypes.concat([
        "image/png",
        "image/jpg",
        "image/jpeg",
      ]);
    }

    return acceptedFileTypes;
  }, [supportsImages, supportsPdf]);

  const fileDisabledString = useMemo(() => {
    if (acceptedFileTypes.length === 0) {
      return "This model does not support attachments. Please select a different model.";
    }
    return "";
  }, [acceptedFileTypes]);

  return (
    <div className="relative flex w-full flex-col">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "absolute bottom-28 left-1/2 z-50 -translate-x-1/2",
              submitDisabledString && "bottom-32",
            )}
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        ref={fileInputRef}
        multiple
        accept={acceptedFileTypes.join(",")}
        onChange={handleFileChange}
        tabIndex={-1}
        disabled={!selectedChatModel || acceptedFileTypes.length === 0}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="mb-2 flex flex-row items-end gap-2 overflow-x-scroll overflow-y-visible"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment
              key={attachment.url}
              attachment={attachment}
              onRemove={() => removeAttachment(attachment)}
              isError={
                ((attachment.contentType?.includes("image") ?? false) &&
                  !supportsImages) ||
                ((attachment.contentType?.includes("pdf") ?? false) &&
                  !supportsPdf)
              }
            />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="relative">
        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={handleInput}
          className={cn(
            "bg-muted h-auto max-h-[calc(75dvh)] min-h-[24px] resize-none overflow-hidden rounded-2xl pb-14 !text-base dark:border-zinc-700",
            className,
          )}
          rows={2}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (status === "streaming" || status === "submitted") {
                toast.error(
                  "Please wait for the model to finish its response!",
                );
              } else {
                submitForm();
              }
            }
          }}
          disabled={!selectedChatModel}
        />

        <div className="absolute bottom-0 flex w-fit flex-row justify-start gap-2 p-2">
          <AttachmentsButton
            fileInputRef={fileInputRef}
            status={status}
            disabledString={fileDisabledString}
          />
          <ModelSelect />
          <NativeSearchToggle />
          <ToolsSelect />
        </div>

        <div className="absolute right-0 bottom-0 flex w-fit flex-row justify-end p-2">
          {status === "submitted" ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={uploadQueue}
              disabled={!selectedChatModel || !!submitDisabledString}
            />
          )}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{
          opacity: submitDisabledString ? 1 : 0,
          height: submitDisabledString ? "auto" : 0,
          marginTop: submitDisabledString ? 8 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="text-sm text-yellow-600"
      >
        {submitDisabledString}
      </motion.div>
      <AnimatePresence></AnimatePresence>
    </div>
  );
};

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    return equal(prevProps, nextProps);
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
  disabledString,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers["status"];
  disabledString: string;
}) {
  const button = (
    <Button
      data-testid="attachments-button"
      size="icon"
      variant="outline"
      className={cn("bg-transparent", {
        "cursor-not-allowed opacity-50": status !== "ready" || !!disabledString,
      })}
      onClick={(event) => {
        event.preventDefault();
        if (status === "ready" && !disabledString) {
          fileInputRef.current?.click();
        }
      }}
      disabled={status !== "ready"}
    >
      <Paperclip size={14} />
    </Button>
  );

  if (disabledString) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent className="max-w-xs text-center">
            {disabledString}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers["setMessages"];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="h-fit rounded-full border p-1.5 dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <Octagon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

interface SendButtonProps {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  disabled: boolean;
}

const PureSendButton: React.FC<SendButtonProps> = ({
  submitForm,
  input,
  uploadQueue,
  disabled,
}) => {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      size="icon"
      disabled={input.length === 0 || uploadQueue.length > 0 || disabled}
    >
      <ArrowUp size={14} />
    </Button>
  );
};

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
