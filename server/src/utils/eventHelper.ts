import { Event } from '@prisma/client';
import { prisma } from '../prisma';

export interface EventStatusSummary {
  id: string;
  name: string;
  status: 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED';
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  remainingSeconds: number;
  serverTime: string;
  isLeaderboardVisible: boolean;
  canSubmit: boolean;
}

export async function getActiveEvent(): Promise<Event> {
  let event = await prisma.event.findFirst();
  if (!event) {
    event = await prisma.event.create({
      data: {
        id: 'security-jeopardy-main-event',
        name: 'SECURITY JEOPARDY',
        status: 'NOT_STARTED',
        durationMinutes: 60,
        isLeaderboardVisible: true,
      },
    });
  }

  // Check if RUNNING event has expired
  if (event.status === 'RUNNING' && event.endTime) {
    const now = new Date();
    if (now >= event.endTime) {
      event = await prisma.event.update({
        where: { id: event.id },
        data: { status: 'ENDED' },
      });
    }
  }

  return event;
}

export function computeEventSummary(event: Event): EventStatusSummary {
  const now = new Date();
  let remainingSeconds = 0;
  let canSubmit = false;

  if (event.status === 'NOT_STARTED') {
    remainingSeconds = event.durationMinutes * 60;
    canSubmit = false;
  } else if (event.status === 'RUNNING') {
    if (event.endTime) {
      const diffMs = event.endTime.getTime() - now.getTime();
      remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
      canSubmit = remainingSeconds > 0;
    } else {
      remainingSeconds = event.durationMinutes * 60;
      canSubmit = true;
    }
  } else if (event.status === 'PAUSED') {
    remainingSeconds = event.remainingSecondsWhenPaused ?? event.durationMinutes * 60;
    canSubmit = false;
  } else if (event.status === 'ENDED') {
    remainingSeconds = 0;
    canSubmit = false;
  }

  return {
    id: event.id,
    name: event.name,
    status: event.status as 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED',
    startTime: event.startTime ? event.startTime.toISOString() : null,
    endTime: event.endTime ? event.endTime.toISOString() : null,
    durationMinutes: event.durationMinutes,
    remainingSeconds,
    serverTime: now.toISOString(),
    isLeaderboardVisible: event.isLeaderboardVisible,
    canSubmit,
  };
}
