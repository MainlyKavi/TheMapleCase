// Contract between the desktop and its stage module (public: src/stage/desktop.ts,
// film: private/stage/desktop.tsx). Types only; safe to import anywhere.

import type { VNode } from '@/desktop/model/vfs';
import type { StoryEvent } from '@/investigation/engine';

export interface DesktopAccount {
  user: string;
  fullName: string;
  host: string;
}

export interface ClockConfig {
  /** 'system' = the viewer's clock; otherwise a fixed "HH:MM" (24h) shown and frozen. */
  time: 'system' | string;
  /** 'system' = viewer's date; null = no date shown anywhere (fictional date undecided); or ISO "YYYY-MM-DD". */
  date: 'system' | null | string;
}

export interface WindowSpec {
  appId: string;
  props?: Record<string, unknown>;
  bounds?: Partial<{ x: number; y: number; w: number; h: number }>;
  minimized?: boolean;
}

/** A reproducible starting layout for a shot. */
export interface ScenePreset {
  id: string;
  label: string;
  windows: WindowSpec[];
  /** Story events fired (in order) after the reset. */
  events?: string[];
}

/** Approved story correspondence only. Mail never connects to a real server. */
export interface MailMessage {
  id: string;
  mailbox: 'inbox' | 'sent' | 'drafts' | 'trash';
  from: string;
  to: string;
  subject: string;
  /** ISO date only when canon establishes it. */
  date?: string;
  body: string[];
  /** VFS node ids of attached files. */
  attachments?: string[];
  threadId?: string;
  read?: boolean;
}

export interface DesktopStage {
  account: DesktopAccount;
  mail: MailMessage[];
  clock: ClockConfig;
  nodes: VNode[];
  events: StoryEvent[];
  presets: ScenePreset[];
}

/** What a production director may do to the desktop. */
export interface DirectorApi {
  reset(): void;
  applyPreset(id: string): void;
  fire(eventId: string): void;
  setClock(clock: ClockConfig): void;
}
