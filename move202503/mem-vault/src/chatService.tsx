import { useCurrentAccount } from "@mysten/dapp-kit";
import { createContext, useCallback, useContext } from "react";

const API_BASE_URL = `https://api.brainsdance.com/api`;

interface ChatService {
    sendMessage: (
        message: string,
        history: Message[],
        v2: boolean,
        onChunk: (chunk: string) => void,
        onDone: () => void,
        onError: (error: Error) => void
    ) => Promise<void>;
}

export const ChatServiceContext = createContext<ChatService>({
    sendMessage: async () => {
        throw new Error("sendMessage not implemented");
    }
});

export interface Message {
    id: number;
    text: string;
    isUser: boolean;
    isTyping?: boolean;
}

export const ChatServiceProvider = ({ children }: { children: React.ReactNode }) => {
    const suiAddress = useCurrentAccount();

    const sendMessage = useCallback(async (
        message: string,
        history: Message[],
        v2: boolean,
        onChunk: (chunk: string) => void,
        onDone: () => void,
        onError: (error: Error) => void
    ): Promise<void> => {
        try {
            const userId = suiAddress?.address;
            console.log(`Sending message to AI (streaming) for user ${userId}:`, message);

            const response = await fetch(`${API_BASE_URL}/chat${v2 ? 'V2' : ''}`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify({
                    message,
                    history: history.map(msg => ({
                        role: msg.isUser ? 'user' : 'assistant',
                        content: msg.text
                    })),
                    user_id: userId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("AI response failed:", errorText);
                throw new Error(`Chat request failed: ${response.statusText}`);
            }

            // 处理服务器发送的事件流
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No readable stream available");
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            const data = JSON.parse(line.slice(5).trim());

                            if (data.content) {
                                onChunk(data.content);
                            }

                            if (data.done) {
                                onDone();
                                return;
                            }

                            if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (parseError) {
                            console.warn("Error parsing SSE data:", parseError);
                        }
                    }
                }
            }

            onDone();
        } catch (error) {
            console.error("Error in streaming chat:", error);
            onError(error instanceof Error ? error : new Error(String(error)));
        }
    }, [suiAddress]);

    return (
        <ChatServiceContext.Provider value={{ sendMessage }}>
            {children}
        </ChatServiceContext.Provider>
    )
};

export const useChatService = () => {
    const context = useContext(ChatServiceContext);
    if (!context) {
        throw new Error("useChatService must be used within a ChatServiceProvider");
    }
    return context;
};