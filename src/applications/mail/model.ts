// Mail logic, pure (node-testable). Messages come only from the stage module: approved story
// correspondence. Nothing here can send or fetch real mail.

import type { MailMessage } from '../../stage/desktop-types.ts';

export const MAILBOXES = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'sent', label: 'Sent' },
  { id: 'trash', label: 'Trash' },
] as const;

export type MailboxId = (typeof MAILBOXES)[number]['id'];

/** Messages in a mailbox matching every search term (from, to, subject, body). */
export function filterMessages(all: MailMessage[], mailbox: MailboxId, query: string): MailMessage[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return all
    .filter((m) => m.mailbox === mailbox)
    .filter((m) => {
      if (!terms.length) return true;
      const hay = `${m.from} ${m.to} ${m.subject} ${m.body.join(' ')}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id));
}

/** Groups messages into threads (by threadId, else by normalised subject). */
export function threads(list: MailMessage[]): { key: string; messages: MailMessage[] }[] {
  const map = new Map<string, MailMessage[]>();
  for (const m of list) {
    const key = m.threadId ?? m.subject.replace(/^((re|fwd?):\s*)+/i, '').trim().toLowerCase();
    map.set(key, [...(map.get(key) ?? []), m]);
  }
  return [...map.entries()].map(([key, messages]) => ({ key, messages }));
}

export const unreadCount = (all: MailMessage[], mailbox: MailboxId, read: Set<string>) =>
  all.filter((m) => m.mailbox === mailbox && !m.read && !read.has(m.id)).length;
