import { useCallback, useEffect, useState } from 'react';
import { ticketService, type TicketQuery } from '@/services';
import type { Ticket } from '@/types';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Ticket list that refreshes whenever the service reports a change. */
export function useTickets(query: TicketQuery = {}): AsyncState<Ticket[]> {
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const { type, requesterEmail, search } = query;

  useEffect(() => ticketService.subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    ticketService
      .list({ type, requesterEmail, search })
      .then((tickets) => {
        if (cancelled) return;
        setData(tickets);
        setError(null);
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [type, requesterEmail, search, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, error, reload };
}

/** Single ticket, kept in sync with the service. `undefined` data = not found. */
export function useTicket(id: string | undefined): AsyncState<Ticket | undefined> {
  const [data, setData] = useState<Ticket | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => ticketService.subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    ticketService
      .get(id)
      .then((ticket) => !cancelled && setData(ticket))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, error, reload };
}
