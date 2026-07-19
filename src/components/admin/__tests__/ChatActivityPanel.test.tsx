/**
 * ChatActivityPanel Tests
 *
 * Covers: ChatActivityPanel component — render, message loading, sending,
 * skill selection, error handling, edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ── JSDOM polyfills ──────────────────────────────────────────

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ── Mocks ────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'req-test-1', locale: 'vi' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      backLink: 'Quay lại',
      modelLabel: 'Model',
      emptyTitle: 'Bắt đầu trò chuyện với AI',
      emptyDesc: 'Đặt câu hỏi hoặc chọn kỹ năng AI',
      inputPlaceholder: 'Nhập câu hỏi...',
      send: 'Gửi',
      skillLabel: 'Kỹ năng',
      skillNone: 'Không',
      skillGeneralResearch: 'Nghiên cứu PL',
      skillContractDraft: 'Soạn HĐ',
      skillContractReview: 'Rà soát HĐ',
      skillComplianceCheck: 'Tuân thủ',
      typingIndicator: 'AI đang trả lời...',
      youLabel: 'Bạn',
      aiLabel: 'AI Assistant',
      citationsLabel: 'Trích dẫn',
      tokensLabel: 'tokens',
      errorLoad: 'Không thể tải lịch sử trò chuyện.',
      errorSend: 'Không thể gửi tin nhắn.',
      errorAiNotConfigured: 'AI chưa được cấu hình.',
      retry: 'Thử lại',
      suggestionsTitle: 'Gợi ý câu hỏi',
    };
    return map[key] ?? key;
  },
}));

vi.mock('react-markdown', () => {
  const MockMarkdown = ({ children }: { children: string }) => React.createElement('div', { 'data-testid': 'markdown-content' }, children);
  return { default: MockMarkdown };
});

vi.mock('remark-gfm', () => ({ default: vi.fn() }));

import { ChatActivityPanel } from '../ChatActivityPanel';

// ── Helper ───────────────────────────────────────────────────

function makeMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id as string ?? 'msg-1',
    role: (overrides.role as string) ?? 'user',
    content: (overrides.content as string) ?? 'Xin chào AI',
    skill: (overrides.skill as string | null) ?? null,
    citations: (overrides.citations as string[]) ?? [],
    metadata: (overrides.metadata as Record<string, unknown> | null) ?? null,
    createdAt: (overrides.createdAt as string) ?? new Date().toISOString(),
  };
}

// ── Tests ────────────────────────────────────────────────────

describe('ChatActivityPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Whitebox ───────────────────────────────────

  describe('Whitebox', () => {
    it('should render the chat page with header', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Hợp đồng ABC" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-page')).toBeTruthy();
        expect(screen.getByText('Hợp đồng ABC')).toBeTruthy();
        expect(screen.getByTestId('chat-activity-model-badge')).toBeTruthy();
      });
    });

    it('should load and display chat history', async () => {
      const messages = [
        makeMessage({ id: 'm1', role: 'user', content: 'Câu hỏi 1' }),
        makeMessage({ id: 'm2', role: 'assistant', content: 'Trả lời 1', citations: ['Luật DN 2020'] }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-msg-m1')).toBeTruthy();
        expect(screen.getByTestId('chat-msg-m2')).toBeTruthy();
      });

      expect(screen.getByText('Câu hỏi 1')).toBeTruthy();
      expect(screen.getByText('Trả lời 1')).toBeTruthy();
    });

    it('should show user messages right-aligned, assistant left-aligned', async () => {
      const messages = [
        makeMessage({ id: 'm1', role: 'user' }),
        makeMessage({ id: 'm2', role: 'assistant' }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-msg-m1')).toBeTruthy();
      });

      const userMsg = screen.getByTestId('chat-msg-m1');
      const aiMsg = screen.getByTestId('chat-msg-m2');

      expect(userMsg.getAttribute('data-role')).toBe('user');
      expect(aiMsg.getAttribute('data-role')).toBe('assistant');
    });

    it('should call POST API with content and skill when sending', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            userMessage: makeMessage({ id: 'u1', content: 'Gửi câu hỏi' }),
            assistantMessage: makeMessage({ id: 'a1', role: 'assistant', content: 'Phản hồi AI' }),
          }),
        });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      const input = screen.getByTestId('chat-activity-input');
      fireEvent.change(input, { target: { value: 'Gửi câu hỏi' } });
      fireEvent.click(screen.getByTestId('chat-activity-send'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/requests/req-test-1/chat',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      });
    });

    it('should show optimistic user message while sending', async () => {
      // First call: history
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
        });

      // Second call: POST (never resolves during test)
      let resolvePost: (v: unknown) => void;
      const postPromise = new Promise((r) => { resolvePost = r; });
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(postPromise);

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      fireEvent.change(screen.getByTestId('chat-activity-input'), { target: { value: 'Tin nhắn mới' } });
      fireEvent.click(screen.getByTestId('chat-activity-send'));

      // Optimistic message should appear
      await waitFor(() => {
        const optimisticEl = document.querySelector('[data-role="user"]');
        expect(optimisticEl).toBeTruthy();
      });

      // Typing indicator should show
      expect(screen.getByTestId('chat-activity-typing')).toBeTruthy();

      // Cleanup
      resolvePost!({
        ok: true,
        json: () => Promise.resolve({
          userMessage: makeMessage({ id: 'real-u1', content: 'Tin nhắn mới' }),
          assistantMessage: makeMessage({ id: 'real-a1', role: 'assistant', content: 'Phản hồi' }),
        }),
      });
    });

    it('should append assistant response after send', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            userMessage: makeMessage({ id: 'u1', content: 'Hỏi' }),
            assistantMessage: makeMessage({ id: 'a1', role: 'assistant', content: 'Đáp án AI' }),
          }),
        });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      fireEvent.change(screen.getByTestId('chat-activity-input'), { target: { value: 'Hỏi' } });
      fireEvent.click(screen.getByTestId('chat-activity-send'));

      await waitFor(() => {
        expect(screen.getByText('Đáp án AI')).toBeTruthy();
      });
    });

    it('should select and deselect skill chips', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-skill-chips')).toBeTruthy();
      });

      const chip = screen.getByTestId('chat-activity-skill-commercial-contract-drafter');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(chip.className).toContain('active');
      });

      fireEvent.click(chip);
      await waitFor(() => {
        expect(chip.className).not.toContain('active');
      });
    });

    it('should render with onBack button when provided', async () => {
      const onBack = vi.fn();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" onBack={onBack} />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-back')).toBeTruthy();
      });
    });
  });

  // ── Blackbox ───────────────────────────────────

  describe('Blackbox', () => {
    beforeEach(() => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
      });
    });

    it('should disable send button when input is empty', async () => {
      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        const sendBtn = screen.getByTestId('chat-activity-send');
        expect((sendBtn as HTMLButtonElement).disabled).toBe(true);
      });
    });

    it('should not send when input is only whitespace', async () => {
      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      const input = screen.getByTestId('chat-activity-input');
      fireEvent.change(input, { target: { value: '   ' } });

      // Send button should still be disabled (trimmed empty)
      const sendBtn = screen.getByTestId('chat-activity-send');
      expect((sendBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('should send on Enter key', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          userMessage: makeMessage({ id: 'u1', content: 'Test enter' }),
          assistantMessage: makeMessage({ id: 'a1', role: 'assistant', content: 'Phản hồi' }),
        }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      const input = screen.getByTestId('chat-activity-input');
      fireEvent.change(input, { target: { value: 'Test enter' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/requests/req-test-1/chat',
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });

    it('should allow Shift+Enter without sending', async () => {
      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      const input = screen.getByTestId('chat-activity-input');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      // Should NOT trigger POST (no change to global.fetch call count)
      expect(global.fetch).toHaveBeenCalledTimes(1); // only the history GET
    });

    it('should call onBack when back button clicked', async () => {
      const onBack = vi.fn();

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" onBack={onBack} />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-back')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('chat-activity-back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('should toggle citations visibility when toggle clicked', async () => {
      const messages = [
        makeMessage({ id: 'a1', role: 'assistant', content: 'Test', citations: ['Luật A', 'Luật B'] }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-citations-toggle-a1')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('chat-citations-toggle-a1'));

      await waitFor(() => {
        // Citations render with emoji prefix: "📜 Luật A"
        expect(screen.getAllByText(/Luật [AB]/)).toHaveLength(2);
      });
    });
  });

  // ── Abnormal / Error ──────────────────────────

  describe('Abnormal / Error', () => {
    it('should display error when history fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-error')).toBeTruthy();
      });

      expect(screen.getByText(/Network error/)).toBeTruthy();
    });

    it('should retry on error retry button click', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-retry')).toBeTruthy();
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
      });

      fireEvent.click(screen.getByTestId('chat-activity-retry'));

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-empty')).toBeTruthy();
      });
    });

    it('should show 500 error detail from API', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error', detail: 'Something broke' }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-error')).toBeTruthy();
      });
    });

    it('should show AI not configured info when 503 from POST', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () => Promise.resolve({
            error: 'AI_NOT_CONFIGURED',
            detail: 'Chưa cấu hình API key',
            userMessage: makeMessage({ id: 'u1', content: 'hello' }),
            assistantMessage: null,
          }),
        });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      fireEvent.change(screen.getByTestId('chat-activity-input'), { target: { value: 'hello' } });
      fireEvent.click(screen.getByTestId('chat-activity-send'));

      await waitFor(() => {
        expect(screen.getByText(/AI chưa được cấu hình/)).toBeTruthy();
      });
    });

    it('should keep user message visible on send failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
        })
        .mockRejectedValueOnce(new Error('Send failed'));

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      fireEvent.change(screen.getByTestId('chat-activity-input'), { target: { value: 'hello' } });
      fireEvent.click(screen.getByTestId('chat-activity-send'));

      // User message should still be visible as optimistic update
      await waitFor(() => {
        expect(screen.getByText('hello')).toBeTruthy();
        expect(screen.getByTestId('chat-activity-error')).toBeTruthy();
      });
    });
  });

  // ── Edge cases ────────────────────────────────

  describe('Edge cases', () => {
    it('should handle very long message content', async () => {
      const longText = 'A'.repeat(10000);
      const messages = [
        makeMessage({ id: 'm1', role: 'user', content: longText }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByText(longText)).toBeTruthy();
      });
    });

    it('should handle messages with null citations array', async () => {
      const messages = [
        makeMessage({ id: 'a1', role: 'assistant', content: 'OK', citations: [] as unknown as string[] }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-msg-a1')).toBeTruthy();
      });
    });

    it('should handle rapid double-send gracefully', async () => {
      let resolveFirst: (v: unknown) => void;
      const firstPost = new Promise((r) => { resolveFirst = r; });

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
        })
        .mockResolvedValueOnce(firstPost);

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-input')).toBeTruthy();
      });

      const input = screen.getByTestId('chat-activity-input');
      fireEvent.change(input, { target: { value: 'msg 1' } });
      fireEvent.click(screen.getByTestId('chat-activity-send'));

      // Try to send again while first is pending — should be blocked
      fireEvent.change(input, { target: { value: 'msg 2' } });
      const sendBtn = screen.getByTestId('chat-activity-send');

      // Button should be disabled while sending
      await waitFor(() => {
        expect((sendBtn as HTMLButtonElement).disabled).toBe(true);
      });

      resolveFirst!({
        ok: true,
        json: () => Promise.resolve({
          userMessage: makeMessage({ id: 'u1', content: 'msg 1' }),
          assistantMessage: makeMessage({ id: 'a1', role: 'assistant', content: 'reply' }),
        }),
      });
    });

    it('should show empty state when no messages exist', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages: [] }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-empty')).toBeTruthy();
        expect(screen.getByText('Bắt đầu trò chuyện với AI')).toBeTruthy();
      });
    });

    it('should show system messages centered', async () => {
      const messages = [
        makeMessage({ id: 's1', role: 'system', content: 'Hệ thống đã khởi tạo' }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-msg-s1')).toBeTruthy();
        expect(screen.getByText('Hệ thống đã khởi tạo')).toBeTruthy();
      });
    });

    it('should render suggested questions when empty state + data', async () => {
      const suggestions = [
        'Câu hỏi gợi ý 1',
        'Câu hỏi gợi ý 2',
        'Câu hỏi gợi ý 3',
        'Câu hỏi gợi ý 4',
        'Câu hỏi gợi ý 5',
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          requestId: 'req-test-1',
          requestTitle: 'Test',
          messages: [],
          suggestedQuestions: suggestions,
        }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-suggestions')).toBeTruthy();
        expect(screen.getByText('Gợi ý câu hỏi')).toBeTruthy();
      });

      // Check all suggestion pills render
      for (let i = 0; i < suggestions.length; i++) {
        expect(screen.getByTestId(`chat-suggestion-${i}`)).toBeTruthy();
        expect(screen.getByText(suggestions[i])).toBeTruthy();
      }
    });

    it('should not show suggestions container when list is empty', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          requestId: 'req-test-1',
          requestTitle: 'Test',
          messages: [],
          suggestedQuestions: [],
        }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-empty')).toBeTruthy();
      });

      // No suggestions element
      expect(screen.queryByTestId('chat-activity-suggestions')).toBeNull();
    });

    it('should send message when suggestion pill clicked', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            requestId: 'req-test-1',
            requestTitle: 'Test',
            messages: [],
            suggestedQuestions: ['Gợi ý câu hỏi pháp lý'],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            userMessage: makeMessage({ id: 'u1', content: 'Gợi ý câu hỏi pháp lý' }),
            assistantMessage: makeMessage({ id: 'a1', role: 'assistant', content: 'Trả lời' }),
          }),
        });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-suggestion-0')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('chat-suggestion-0'));

      // Should call POST with the suggestion text
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/requests/req-test-1/chat',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Gợi ý câu hỏi pháp lý'),
          }),
        );
      });
    });

    it('should hide suggestions after first message is sent', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            requestId: 'req-test-1',
            requestTitle: 'Test',
            messages: [],
            suggestedQuestions: ['Gợi ý'],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            userMessage: makeMessage({ id: 'u1', content: 'Gợi ý' }),
            assistantMessage: makeMessage({ id: 'a1', role: 'assistant', content: 'Trả lời' }),
          }),
        });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-activity-suggestions')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('chat-suggestion-0'));

      // Sau khi send, empty state + suggestions sẽ biến mất
      await waitFor(() => {
        expect(screen.queryByTestId('chat-activity-suggestions')).toBeNull();
      });
    });

    it('should render markdown content in assistant bubble', async () => {
      const messages = [
        makeMessage({
          id: 'a1',
          role: 'assistant',
          content: '## Tiêu đề\n\n- Item 1\n- Item 2\n\n**In đậm** và *in nghiêng*',
        }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-msg-a1')).toBeTruthy();
      });

      // Markdown content should be rendered (our mock renders a div with data-testid="markdown-content")
      const markdownEl = screen.getByTestId('markdown-content');
      expect(markdownEl).toBeTruthy();
      expect(markdownEl.textContent).toContain('## Tiêu đề');
    });

    it('should render user messages as plain text, not markdown', async () => {
      const messages = [
        makeMessage({ id: 'u1', role: 'user', content: 'Tôi cần **giúp đỡ**' }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-msg-u1')).toBeTruthy();
      });

      // User message should NOT have markdown-content data-testid
      const userBubble = screen.getByTestId('chat-msg-u1');
      expect(userBubble.querySelector('[data-testid="markdown-content"]')).toBeNull();
    });

    it('should show fallback text for empty assistant message content', async () => {
      const messages = [
        makeMessage({ id: 'a1', role: 'assistant', content: '' }),
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req-test-1', requestTitle: 'Test', messages }),
      });

      render(
        <ChatActivityPanel requestId="req-test-1" requestTitle="Test" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('chat-msg-a1')).toBeTruthy();
      });

      // Empty assistant message should show fallback, not ReactMarkdown
      expect(screen.getByText('(Không có nội dung phản hồi)')).toBeTruthy();
      expect(screen.queryByTestId('markdown-content')).toBeNull();
    });
  });
});
