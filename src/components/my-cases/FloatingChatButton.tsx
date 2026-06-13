'use client';

import { MessageCircle } from 'lucide-react';

interface FloatingChatButtonProps {
  notificationCount?: number;
  locale?: string;
  notificationText?: string;
}

const TRANSLATIONS = {
  vi: 'Hỗ trợ',
  en: 'Support',
  zh: '支持',
  ja: 'サポート',
};

export default function FloatingChatButton({
  notificationCount = 0,
  locale = 'vi',
  notificationText
}: FloatingChatButtonProps) {
  const label = notificationText || TRANSLATIONS[locale as keyof typeof TRANSLATIONS] || TRANSLATIONS.vi;

  return (
    <button
      className="fixed bottom-5 right-5 min-w-[118px] h-12 bg-gradient-to-b from-red-500 to-red-600 text-white rounded-full border-[3px] border-yellow-400 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 px-4 font-bold"
      onClick={() => console.log('Chat clicked')}
    >
      <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
        <MessageCircle size={16} />
      </span>
      <span>{label}</span>
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </button>
  );
}
