import { useCallback, useRef } from 'react';

import { useChatStore } from '@/store';

const MOCK_RESPONSES = [
  'Bali in March is ideal — warm weather, fewer crowds, and strong villa deals under $1,500 for 5 nights.',
  'For a family trip, Kyoto plus Osaka works well: temples, food markets, and easy day trips by train.',
  'If you want beaches plus culture, consider Kerala — backwaters, spice tours, and boutique stays.',
  'December in the Swiss Alps is peak ski season. Book stays early for Zermatt or Grindelwald packages.',
  'A Maldives villa package usually includes seaplane transfers — compare half-board vs full-board pricing.',
  'For adventure on a budget, Costa Rica offers rainforest hikes, zip-lines, and Pacific coast stays.',
  'Tokyo + Hakone is a great 6-night loop: city food scene, then onsen and lake views near Mount Fuji.',
  'Santorini sunsets are busiest in August. Late September gives similar views with lower hotel rates.',
];

const LOADING_DELAY_MS = 700;
const TOKEN_DELAY_MS = 35;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function pickMockResponse() {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
}

export function useMockAiChat() {
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const startAssistantMessage = useChatStore((state) => state.startAssistantMessage);
  const appendToMessage = useChatStore((state) => state.appendToMessage);
  const completeMessage = useChatStore((state) => state.completeMessage);
  const setAwaitingResponse = useChatStore((state) => state.setAwaitingResponse);
  const isAwaitingResponse = useChatStore((state) => state.isAwaitingResponse);

  const isSendingRef = useRef(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();

      if (!trimmed || isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;
      addUserMessage(trimmed);
      setAwaitingResponse(true);

      await delay(LOADING_DELAY_MS);

      const response = pickMockResponse();
      const assistantId = startAssistantMessage();
      setAwaitingResponse(false);

      const tokens = response.split(' ');

      for (let index = 0; index < tokens.length; index += 1) {
        const token = index === tokens.length - 1 ? tokens[index] : `${tokens[index]} `;
        appendToMessage(assistantId, token);
        await delay(TOKEN_DELAY_MS);
      }

      completeMessage(assistantId);
      isSendingRef.current = false;
    },
    [
      addUserMessage,
      appendToMessage,
      completeMessage,
      setAwaitingResponse,
      startAssistantMessage,
    ],
  );

  return {
    sendMessage,
    isAwaitingResponse,
  };
}
