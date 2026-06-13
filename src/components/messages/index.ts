// Messages components - Phase 43
// Path: src/components/messages/

export { type ThreadData, type ThreadItemProps } from './ThreadItem';
export { type MessageData, type MessageBubbleProps } from './MessageBubble';
export { type ComposerProps } from './Composer';
export { type CaseInfo, type InfoPanelProps } from './InfoPanel';
export { type ThreadListPanelProps } from './ThreadListPanel';
export { type ChatPanelProps } from './ChatPanel';
export { type MessagesContainerProps } from './MessagesContainer';
export { type MessagesClientProps } from './MessagesClient';

// Default exports
export { default as ThreadItem } from './ThreadItem';
export { default as MessageBubble } from './MessageBubble';
export { default as Composer } from './Composer';
export { default as InfoPanel } from './InfoPanel';
export { default as ThreadListPanel } from './ThreadListPanel';
export { default as ChatPanel } from './ChatPanel';
export { default as MessagesContainer } from './MessagesContainer';
export { default as MessagesClient } from './MessagesClient';

// Import CSS
import './messages.css';
