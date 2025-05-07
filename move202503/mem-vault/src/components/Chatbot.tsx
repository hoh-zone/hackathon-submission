import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Card, Container, Flex, Text, TextArea } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Message } from '../chatService';

const API_BASE_URL = `https://api.brainsdance.com/api`;

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatLoaded = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatLoaded.current) return;
    chatLoaded.current = true;
    const chatData = localStorage.getItem('CHAT_DATA');
    const startId = Date.now();
    if (chatData) {
      const parsedChatData = JSON.parse(chatData) as { messages: { role: "user" | "assistant"; content: string }[] };
      setMessages(parsedChatData.messages.map((chat, index): Message => ({
        id: startId + index,
        text: chat.content,
        isUser: chat.role === 'user',
        isTyping: false
      })))
    } else {
      setMessages([
        {
          id: startId + 0,
          isUser: true,
          text: "Please translate into Chinese: hello we are the builders of memory vault, a decentralized AI memory sharing platform. Creators can interact with chatbots and upload these conversations into their own SPACE. Users can subscribe to those spaces, and continue the conversation with a chatbot."
        },
        {
          id: startId + 1,
          isUser: false,
          text: "你好，我们是Memory Vault的开发者，这是一个去中心化的AI记忆共享平台。创作者可以与聊天机器人互动，并将这些对话上传到他们专属的SPACE空间中。用户可以订阅这些空间，并继续与聊天机器人展开对话。  \n\n（注：根据技术语境优化了术语翻译——\"SPACE\"保留英文大写强调产品功能模块，\"chatbot\"译为行业通用词\"聊天机器人\"，并采用\"去中心化\"等区块链领域标准译法，确保概念准确性。）"
        }
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      const userId = currentAccount?.address;
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text
          })),
          user_id: userId,
          model: 'deepseek-chat'
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let aiResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              console.log('Received chunk:', parsed);

              const content = parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.message?.content ||
                parsed.content ||
                parsed.text;

              if (content) {
                aiResponse += content;
                console.log('Current AI response:', aiResponse);

                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];

                  if (lastMessage && !lastMessage.isUser) {
                    return newMessages.map((msg, idx) =>
                      idx === newMessages.length - 1
                        ? { ...msg, text: aiResponse }
                        : msg
                    );
                  } else {
                    return [...newMessages, { id: Date.now(), text: aiResponse, isUser: false }];
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing chunk:', e, 'Raw data:', data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: '抱歉，发生了错误。请稍后重试。',
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="3" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    }}>
      {/* 顶部导航栏 */}
      <Flex
        px="5"
        py="3"
        justify="between"
        align="center"
        style={{
          background: 'rgba(26, 26, 46, 0.7)',
          backdropFilter: 'blur(15px)',
          borderBottom: '1px solid rgba(144, 224, 239, 0.3)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          style={{ color: '#ade8f4' }}
        >
          返回主页
        </Button>
        <Text size="5" weight="bold" style={{ color: '#ade8f4' }}>
          Memory Orb AI
        </Text>
        <div style={{ width: '100px' }} />
      </Flex>

      {/* 聊天区域 */}
      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          background: 'rgba(26, 26, 46, 0.3)',
          backdropFilter: 'blur(10px)',
          marginTop: '60px',
          marginBottom: '100px',
          height: 'calc(100vh - 160px)',
          display: 'flex',
          flexDirection: 'column',
          border: 'none',
        }}
      >
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {messages.map((message, index) => (
            <Flex
              key={index}
              justify={message.isUser ? 'end' : 'start'}
              mb="4"
            >
              <Card
                style={{
                  maxWidth: '70%',
                  background: message.isUser
                    ? 'linear-gradient(135deg, rgba(173, 232, 244, 0.2), rgba(144, 224, 239, 0.4))'
                    : 'linear-gradient(135deg, rgba(144, 224, 239, 0.1), rgba(173, 232, 244, 0.2))',
                  border: '1px solid rgba(173, 232, 244, 0.5)',
                  borderRadius: '20px',
                  padding: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: message.isUser
                      ? 'radial-gradient(circle at 50% 50%, rgba(173, 232, 244, 0.1) 0%, rgba(255, 255, 255, 0) 70%)'
                      : 'radial-gradient(circle at 50% 50%, rgba(144, 224, 239, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <Text
                  style={{
                    color: '#e0f7fa',
                    lineHeight: 1.6,
                    position: 'relative',
                    zIndex: 1,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.text}
                </Text>
              </Card>
            </Flex>
          ))}
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* 输入区域 */}
      <Box
        p="4"
        style={{
          background: 'rgba(26, 26, 46, 0.7)',
          backdropFilter: 'blur(15px)',
          borderTop: '1px solid rgba(144, 224, 239, 0.3)',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <Flex gap="3">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的问题..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'rgba(173, 232, 244, 0.1)',
              border: '1px solid rgba(173, 232, 244, 0.5)',
              color: '#ade8f4',
              borderRadius: '20px',
              padding: '1rem',
              resize: 'none',
              minHeight: '60px',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, rgba(173, 232, 244, 0.2), rgba(144, 224, 239, 0.4))',
              color: '#ade8f4',
              border: '1px solid rgba(173, 232, 244, 0.5)',
              borderRadius: '20px',
              padding: '0 2rem',
              height: '60px',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? '发送中...' : '发送'}
          </Button>
        </Flex>
      </Box>
    </Container>
  );
};

export default Chatbot; 