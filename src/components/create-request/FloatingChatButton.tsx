'use client';

import { MessageCircle } from 'lucide-react';

export default function FloatingChatButton() {
  return (
    <button
      className="fixed bottom-5 right-5 min-w-[118px] h-12 bg-gradient-to-b from-red-500 to-red-600 text-white rounded-full border-[3px] border-yellow-400 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 px-4 font-bold"
      onClick={() => console.log('Chat clicked')}
    >
      <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
        <MessageCircle size={16} />
      </span>
      <span>Ho tro</span>
    </button>
  );
}
