'use client';

/* /portfolio/[id]/sign — Bulk-sign page shown after a new squad is
   created (and reachable from a "Sign empty positions" button on the
   squad detail). Lists all 22 slots (11 starters + 11 bench) so the
   user can fill them in one screen instead of clicking each position
   individually. Initial bench fill bypasses the transfer-window gate;
   later bench changes still go through weekend subs / quarterly
   transfers per the season rules. */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppLayout, AssetSelector, Modal } from '@/components';
import { Icon } from '@/components/stadium/Icon';
import { useStore } from '@/store/useStore';
import {
  Portfolio,
  PortfolioPlayer,
  Position,
  FORMATIONS,
  Asset,
  SQUAD_BENCH_COUNT,
  SQUAD_TOTAL_COUNT,
} from '@/types';
import { MOCK_ASSETS } from '@/data/assets';

/* Mirror of the helpers in /portfolio/[id]/page.tsx — when a squad was
   already in auto-balance mode (every filled starter within 0.5% of an
   equal share), the bulk-sign save should re-balance after the new
   signings rather than leave newcomers stuck at the default 9.09%. */
const BALANCED_TOLERANCE = 0.5;
function wasAutoBalanced(players: PortfolioPlayer[]): boolean {
  const filled = players.filter((p) => p.asset && !p.isBench);
  if (filled.length === 0) return true;
  const target = 100 / filled.length;
  return filled.every((p) => Math.abs((p.allocation ?? 0) - target) < BALANCED_TOLERANCE);
}
function rebalanceStarters(players: PortfolioPlayer[]): PortfolioPlayer[] {
  const filledStarterCount = players.filter((p) => p.asset && !p.isBench).length;
  if (filledStarterCount === 0) return players;
  const eq = 100 / filledStarterCount;
  return players.map((p) => (p.asset && !p.isBench ? { ...p, allocation: eq } : p));
}

/* Parse a freeform string of tickers — accepts comma-separated,
   newline-separated, or a JSON array. Returns trimmed, uppercased,
   deduped symbols. Used by both the CSV paste modal (item 16) and the
   ?prefill=AAPL,MSFT URL flow (item 19). */
function parseTickerInput(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  let tokens: string[] = [];
  /* Try JSON array first — must start with [ and parse cleanly into
     an array of strings. */
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        tokens = parsed.map((v) => String(v));
      }
    } catch {
      /* Not valid JSON — fall through to delimiter parsing. */
    }
  }
  if (tokens.length === 0) {
    /* Split on comma or any whitespace (newline, tab, space). */
    tokens = trimmed.split(/[\s,]+/);
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    const sym = t.trim().toUpperCase();
    if (!sym) continue;
    /* Strip common wrappers like quotes or trailing commas that JSON
       fallback leaves behind ('"AAPL"' → 'AAPL'). */
    const clean = sym.replace(/^['"]+|['"]+$/g, '').replace(/[,;]+$/, '');
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

/* Resolve a list of symbols to Asset objects. Tries MOCK_ASSETS first
   (instant), then per-symbol /api/yahoo-finance for unknowns. Returns
   { resolved, unknown } so the caller can surface which symbols 404'd.
   Caller is responsible for dedupe-against-portfolio. */
async function resolveSymbols(
  symbols: string[],
): Promise<{ resolved: Asset[]; unknown: string[] }> {
  const resolved: Asset[] = [];
  const unknown: string[] = [];
  for (const sym of symbols) {
    const mock = MOCK_ASSETS.find((a) => a.symbol.toUpperCase() === sym);
    if (mock) {
      resolved.push(mock);
      continue;
    }
    try {
      const res = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json();
      if (data.success && data.asset) {
        resolved.push(data.asset as Asset);
      } else {
        unknown.push(sym);
      }
    } catch {
      unknown.push(sym);
    }
  }
  return { resolved, unknown };
}

/* "Coach's pick" — 11 defensible blue-chips for new managers who
   tap the Coach button. Low-beta names with broad sector coverage so
   the starting XI isn't a single-sector bet. All symbols verified
   present in MOCK_ASSETS. Order matches typical starter slot order
   (GK → DEF → MID → FWD) for visual coherence when applied. */
const COACH_BLUE_CHIP_SYMBOLS = [
  'JNJ', 'KO', 'PG', 'VZ', 'JPM', 'MSFT', 'AAPL', 'BRK.B', 'WMT', 'PEP', 'COST',
] as const;

interface SlotEditState {
  positionId: string;
  position: Position | null;        // null for bench slots
  currentAsset: Asset | null;
}

export default function SignSquadPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const portfolioId = params?.id as string;
  const prefillSymbol = searchParams?.get('prefill') || null;
  const { currentUser, updatePortfolio } = useStore();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [pending, setPending] = useState<Map<string, Asset | null>>(new Map());
  const [editingSlot, setEditingSlot] = useState<SlotEditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Tracks whether we've already applied the ?prefill=X param so we
     don't keep re-applying it on every re-render. */
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);

  /* CSV-paste modal (item 16) — opens from the "Paste tickers" button
     in the header strip. Accepts comma/newline/JSON-array input. */
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pastePreview, setPastePreview] = useState<{
    valid: Asset[];
    unknown: string[];
    duplicates: string[];
    overflowSymbols: string[];
  } | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);

  /* When the page is opened from the Market "Sign QQQ" button or via
     a hand-built ?prefill=AAPL,MSFT URL (item 19), parse the symbols
     and stash them in pending. Starters first, then bench. Respects
     the one-ticker-per-squad rule and surfaces a combined notice. */
  useEffect(() => {
    if (prefillApplied || !prefillSymbol || !portfolio) return;
    const symbols = parseTickerInput(prefillSymbol);
    if (symbols.length === 0) {
      setPrefillApplied(true);
      return;
    }
    const limited = symbols.slice(0, SQUAD_TOTAL_COUNT);

    /* Build the set of symbols already in the squad (effective —
       accounts for prior pending edits, though on first run pending
       is empty). */
    const occupied = new Set<string>();
    for (const p of portfolio.players) {
      const eff = effectiveAsset(p.positionId, p.asset);
      if (eff?.symbol) occupied.add(eff.symbol.toUpperCase());
    }

    const duplicates: string[] = [];
    const newSymbols: string[] = [];
    for (const sym of limited) {
      if (occupied.has(sym)) duplicates.push(sym);
      else newSymbols.push(sym);
    }

    let cancelled = false;
    (async () => {
      const { resolved, unknown } = await resolveSymbols(newSymbols);
      if (cancelled) return;

      /* Walk starter slots first, then bench, dropping a pending
         change for each resolved asset until either the queue or the
         empty-slot list is exhausted. */
      const ordered = [
        ...portfolio.players.filter((p) => !p.isBench),
        ...portfolio.players.filter((p) => p.isBench),
      ];
      const nextPending = new Map(pending);
      const placed: string[] = [];
      let queue = [...resolved];
      for (const slot of ordered) {
        if (queue.length === 0) break;
        const eff = effectiveAsset(slot.positionId, slot.asset);
        if (eff || nextPending.has(slot.positionId)) continue;
        const pick = queue.shift();
        if (pick) {
          nextPending.set(slot.positionId, pick);
          placed.push(pick.symbol);
        }
      }
      /* If we ran out of slots before exhausting the queue, the
         leftovers are reported in the notice. */
      const overflow = queue.map((a) => a.symbol);
      setPending(nextPending);

      const parts: string[] = [];
      if (placed.length > 0) {
        parts.push(
          `Added ${placed.length} ticker${placed.length === 1 ? '' : 's'} (${placed.slice(0, 8).join(', ')}${placed.length > 8 ? `, +${placed.length - 8} more` : ''}) — tap Save when you're done.`,
        );
      }
      if (duplicates.length > 0) {
        parts.push(`${duplicates.length} already in squad: ${duplicates.join(', ')}.`);
      }
      if (unknown.length > 0) {
        parts.push(`Couldn't find: ${unknown.join(', ')}.`);
      }
      if (overflow.length > 0) {
        parts.push(`No empty slots for: ${overflow.join(', ')}.`);
      }
      if (parts.length === 0) {
        parts.push('Nothing to add.');
      }
      setPrefillNotice(parts.join(' '));
      setPrefillApplied(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [prefillSymbol, portfolio, pending, prefillApplied]);

  /* Load portfolio. Live fetch (not snapshot) because we're the owner. */
  useEffect(() => {
    if (!portfolioId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/portfolios?id=${portfolioId}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.portfolios?.length > 0) {
          setPortfolio(data.portfolios[0]);
        }
      } catch (e) {
        console.error('Load portfolio failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portfolioId]);

  if (!currentUser) {
    return (
      <AppLayout flush>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p className="display" style={{ fontSize: 16 }}>Sign in to manage your squad.</p>
        </div>
      </AppLayout>
    );
  }

  if (!portfolio) {
    return (
      <AppLayout flush>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p className="mono" style={{ fontSize: 12, color: 'var(--text-mute)' }}>Loading squad…</p>
        </div>
      </AppLayout>
    );
  }

  if (portfolio.userId !== currentUser.id) {
    return (
      <AppLayout flush>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p className="display" style={{ fontSize: 16 }}>
            This is not your squad — you can&apos;t edit it.
          </p>
          <Link href={`/portfolio/${portfolioId}`} className="stadium-btn stadium-btn-ghost" style={{ marginTop: 14 }}>
            View squad
          </Link>
        </div>
      </AppLayout>
    );
  }

  const formationPositions = FORMATIONS[portfolio.formation];

  /* Resolve effective asset for a slot: pending change wins over the
     server-side value. Returns null if user explicitly cleared. */
  const effectiveAsset = (positionId: string, original: Asset | null): Asset | null => {
    if (pending.has(positionId)) return pending.get(positionId) ?? null;
    return original;
  };

  const starterPlayers = portfolio.players.filter((p) => !p.isBench);
  const existingBench = portfolio.players.filter((p) => p.isBench);
  /* Top up the bench section to 11 slots even when the portfolio was
     created before bench support landed. Phantom entries don't exist
     on the server yet; assignAssetToPosition will insert them on save. */
  const benchPlayers: PortfolioPlayer[] = [
    ...existingBench,
    ...Array.from(
      { length: Math.max(0, SQUAD_BENCH_COUNT - existingBench.length) },
      (_, i) => ({
        positionId: `bench-${existingBench.length + i + 1}`,
        asset: null,
        allocation: 0,
        isBench: true as const,
      }),
    ),
  ];

  /* Count across the EFFECTIVE 22 slots (starters + bench, where bench
     includes phantom rows for legacy 11-player portfolios). Counting
     portfolio.players.length undercounted to 11 for legacy squads. */
  const allEffectiveSlots = [...starterPlayers, ...benchPlayers];
  const filledCount = allEffectiveSlots.reduce((n, p) => {
    const asset = effectiveAsset(p.positionId, p.asset);
    return asset ? n + 1 : n;
  }, 0);
  const totalSlots = allEffectiveSlots.length;
  const emptyCount = totalSlots - filledCount;
  const pendingCount = pending.size;

  /* Open the AssetSelector for a specific slot. For starters we look
     up the Position object so the modal can show risk/title context.
     Bench slots pass null position (modal handles it gracefully). */
  const openSlot = (player: PortfolioPlayer) => {
    setError(null);
    const position = player.isBench
      ? null
      : formationPositions.find((pos) => pos.id === player.positionId) || null;
    setEditingSlot({
      positionId: player.positionId,
      position,
      currentAsset: effectiveAsset(player.positionId, player.asset),
    });
  };

  /* Build the set of ticker symbols currently occupying the 22 slots
     (taking pending changes into account, excluding the slot being
     edited). Used to enforce the "one ticker per squad" rule when the
     user is about to assign a new asset. */
  const usedSymbols = (excludePositionId?: string): Set<string> => {
    const set = new Set<string>();
    for (const p of portfolio.players) {
      if (p.positionId === excludePositionId) continue;
      const eff = effectiveAsset(p.positionId, p.asset);
      if (eff?.symbol) set.add(eff.symbol.toUpperCase());
    }
    return set;
  };

  const handleAssetSelected = (asset: Asset | null) => {
    if (!editingSlot) return;
    if (asset && usedSymbols(editingSlot.positionId).has(asset.symbol.toUpperCase())) {
      setError(
        `${asset.symbol} is already in this squad. Each ticker can only be signed once — release the other slot first.`,
      );
      setEditingSlot(null);
      return;
    }
    setError(null);
    setPending((prev) => {
      const next = new Map(prev);
      next.set(editingSlot.positionId, asset);
      return next;
    });
    setEditingSlot(null);
  };

  const clearSlot = (positionId: string) => {
    setPending((prev) => {
      const next = new Map(prev);
      next.set(positionId, null);
      return next;
    });
  };

  const cancelSlotChange = (positionId: string) => {
    setPending((prev) => {
      const next = new Map(prev);
      next.delete(positionId);
      return next;
    });
  };

  /* Coach's pick — populate the 11 STARTER slots with a defensible
     blue-chip basket as pending changes. Respects the one-ticker-per
     squad rule by skipping any blue-chip already in the squad (or
     already pending in another slot). Leaves the bench alone — the
     point is to give brand-new managers a confident starting XI they
     can tweak, not to fill 22 slots. */
  const applyCoachPick = () => {
    setError(null);
    const lookups: Asset[] = [];
    for (const sym of COACH_BLUE_CHIP_SYMBOLS) {
      const asset = MOCK_ASSETS.find(
        (a) => a.symbol.toUpperCase() === sym.toUpperCase(),
      );
      if (asset) lookups.push(asset);
    }
    /* Build the set of symbols already occupying a slot (effective —
       counts pending changes). Coach won't overwrite an existing pick
       or duplicate a ticker. */
    const occupied = new Set<string>();
    for (const p of portfolio.players) {
      const eff = effectiveAsset(p.positionId, p.asset);
      if (eff?.symbol) occupied.add(eff.symbol.toUpperCase());
    }
    const queue = lookups.filter((a) => !occupied.has(a.symbol.toUpperCase()));

    /* Walk the starter slots in order; for each empty (effective)
       slot, take the next blue-chip from the queue. Build the new
       pending map outside the setter so we can also compute the
       user-visible signed count without re-running this logic. */
    const nextPending = new Map(pending);
    let signed = 0;
    for (const p of starterPlayers) {
      if (queue.length === 0) break;
      const eff = effectiveAsset(p.positionId, p.asset);
      if (eff) continue;
      const pick = queue.shift();
      if (pick) {
        nextPending.set(p.positionId, pick);
        signed += 1;
      }
    }
    setPending(nextPending);

    if (signed > 0) {
      setPrefillNotice(
        `Coach signed ${signed} starter${signed === 1 ? '' : 's'}. Tweak any slot before saving.`,
      );
    } else {
      setPrefillNotice(
        'Coach had nothing to sign — your starting XI is already full or all blue-chips are taken.',
      );
    }
  };

  /* "Paste tickers" preview — parses the textarea, resolves symbols,
     and stages a preview the user can confirm. Doesn't touch pending
     until they hit Confirm. */
  const buildPastePreview = async () => {
    setPasteError(null);
    setPasteBusy(true);
    try {
      const symbols = parseTickerInput(pasteText);
      if (symbols.length === 0) {
        setPasteError('No tickers found — paste comma-separated, one-per-line, or a JSON array.');
        setPastePreview(null);
        return;
      }
      const limited = symbols.slice(0, SQUAD_TOTAL_COUNT);

      /* Dedupe against the current squad (including pending edits)
         and within the paste itself. parseTickerInput already deduped
         within the paste; this catches against-the-squad collisions. */
      const occupied = new Set<string>();
      for (const p of portfolio.players) {
        const eff = effectiveAsset(p.positionId, p.asset);
        if (eff?.symbol) occupied.add(eff.symbol.toUpperCase());
      }
      const duplicates: string[] = [];
      const fresh: string[] = [];
      for (const sym of limited) {
        if (occupied.has(sym)) duplicates.push(sym);
        else fresh.push(sym);
      }

      const { resolved, unknown } = await resolveSymbols(fresh);

      /* How many can we actually place? Count empty (effective) slots. */
      const emptySlots = portfolio.players.reduce((n, p) => {
        const eff = effectiveAsset(p.positionId, p.asset);
        return eff ? n : n + 1;
      }, 0);
      const placeable = resolved.slice(0, emptySlots);
      const overflowSymbols = resolved.slice(emptySlots).map((a) => a.symbol);

      setPastePreview({
        valid: placeable,
        unknown,
        duplicates,
        overflowSymbols,
      });
    } catch (e) {
      console.error('Paste preview failed:', e);
      setPasteError('Could not parse input. Try comma-separated tickers or a JSON array.');
      setPastePreview(null);
    } finally {
      setPasteBusy(false);
    }
  };

  /* Apply the previewed list: starters first, then bench, respecting
     the one-ticker-per-squad rule (already filtered in preview). */
  const applyPastePreview = () => {
    if (!pastePreview) return;
    const nextPending = new Map(pending);
    const ordered = [
      ...portfolio.players.filter((p) => !p.isBench),
      ...portfolio.players.filter((p) => p.isBench),
    ];
    let queue = [...pastePreview.valid];
    let signedStarters = 0;
    let signedBench = 0;
    for (const slot of ordered) {
      if (queue.length === 0) break;
      const eff = effectiveAsset(slot.positionId, slot.asset);
      if (eff || nextPending.has(slot.positionId)) continue;
      const pick = queue.shift();
      if (pick) {
        nextPending.set(slot.positionId, pick);
        if (slot.isBench) signedBench += 1;
        else signedStarters += 1;
      }
    }
    setPending(nextPending);
    const total = signedStarters + signedBench;
    const parts: string[] = [];
    if (total > 0) {
      parts.push(
        `${total} ticker${total === 1 ? '' : 's'} staged — tap Save when you're ready.`,
      );
    }
    if (pastePreview.duplicates.length > 0) {
      parts.push(`Skipped duplicates: ${pastePreview.duplicates.join(', ')}.`);
    }
    if (pastePreview.unknown.length > 0) {
      parts.push(`Couldn't find: ${pastePreview.unknown.join(', ')}.`);
    }
    if (pastePreview.overflowSymbols.length > 0) {
      parts.push(`No room for: ${pastePreview.overflowSymbols.join(', ')}.`);
    }
    if (parts.length > 0) setPrefillNotice(parts.join(' '));
    setPasteOpen(false);
    setPasteText('');
    setPastePreview(null);
    setPasteError(null);
  };

  /* Single-shot save: build the full 22-slot players array from the
     starters + (existing-or-phantom) bench, apply each effective
     asset, and PUT in one request. Phantom bench rows that weren't on
     the server yet get inserted as new entries. Earlier this looped
     assignAssetToPosition which reads from state.portfolios — but
     /sign loads the portfolio into local state only, so that store
     lookup returned undefined and every assign was a silent no-op. */
  const saveAll = async () => {
    if (pending.size === 0) {
      router.push(`/portfolio/${portfolioId}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const allSlots = [...starterPlayers, ...benchPlayers];
      const wasBalancedBefore = wasAutoBalanced(portfolio.players);
      const baseNewPlayers: PortfolioPlayer[] = allSlots.map((p) => {
        const eff = effectiveAsset(p.positionId, p.asset);
        return {
          positionId: p.positionId,
          asset: eff,
          allocation: p.allocation,
          ...(p.isBench ? { isBench: true } : {}),
        };
      });
      // If the squad was already balanced before this batch sign-up,
      // re-balance after so newly-signed starters get their fair share
      // instead of the default 9.09% (which would push the total > 100).
      const newPlayers = wasBalancedBefore
        ? rebalanceStarters(baseNewPlayers)
        : baseNewPlayers;
      await updatePortfolio(portfolioId, { players: newPlayers });
      /* Refetch so the user lands on the squad detail with the new
         data instead of a stale store snapshot. */
      router.push(`/portfolio/${portfolioId}`);
    } catch (e) {
      console.error('Bulk save failed:', e);
      setError('Save failed. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout flush>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between" style={{ gap: 14 }}>
          <div>
            <div className="kicker">FIRST KICK-OFF · BUILD YOUR SQUAD</div>
            <h1
              className="display"
              style={{
                fontSize: 'clamp(22px, 3vw, 30px)',
                letterSpacing: '-0.04em',
                margin: '4px 0 0',
              }}
            >
              Sign {portfolio.name}
            </h1>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 6 }}>
              Pick 11 starters and 11 reserves. Save once and you&apos;re ready for kick-off.
            </div>
          </div>
          <div
            className="stadium-card flex items-center"
            style={{ padding: '10px 14px', gap: 12 }}
          >
            <div>
              <div className="kicker">SIGNED</div>
              <div
                className="mono num"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: filledCount === totalSlots ? 'var(--pitch)' : 'var(--text)',
                  letterSpacing: '-0.02em',
                  marginTop: 2,
                }}
              >
                {filledCount} / {totalSlots}
              </div>
            </div>
            <div style={{ width: 1, height: 30, background: 'var(--line)' }} />
            <div>
              <div className="kicker">OPEN</div>
              <div
                className="mono num"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: emptyCount === 0 ? 'var(--text-mute)' : 'var(--whistle)',
                  letterSpacing: '-0.02em',
                  marginTop: 2,
                }}
                title={`${emptyCount} slot${emptyCount === 1 ? '' : 's'} still empty`}
              >
                {emptyCount}
              </div>
            </div>
            <div style={{ width: 1, height: 30, background: 'var(--line)' }} />
            <button
              type="button"
              onClick={applyCoachPick}
              className="stadium-btn stadium-btn-ghost"
              style={{ padding: '8px 12px', fontSize: 11 }}
              title="Auto-fill empty starter slots with a defensible blue-chip basket"
            >
              Coach&apos;s pick
            </button>
            <button
              type="button"
              onClick={() => {
                setPasteText('');
                setPastePreview(null);
                setPasteError(null);
                setPasteOpen(true);
              }}
              className="stadium-btn stadium-btn-ghost"
              style={{ padding: '8px 12px', fontSize: 11 }}
              title="Paste a comma list, one-per-line, or JSON array of up to 22 tickers"
            >
              Paste tickers
            </button>
            <button
              type="button"
              onClick={() => router.push(`/portfolio/${portfolioId}`)}
              className="stadium-btn stadium-btn-ghost"
              style={{ padding: '8px 12px', fontSize: 11 }}
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={saveAll}
              disabled={saving}
              className="stadium-btn stadium-btn-primary"
              style={{ padding: '8px 16px', fontSize: 12, minWidth: 140 }}
            >
              {saving ? 'Saving…' : pending.size > 0 ? `Save ${pending.size} change${pending.size === 1 ? '' : 's'}` : 'Go to squad →'}
            </button>
          </div>
        </div>

        {error && (
          <div
            className="stadium-card"
            style={{
              padding: '10px 14px',
              background: 'oklch(0.65 0.22 25 / 0.08)',
              borderColor: 'oklch(0.65 0.22 25 / 0.4)',
              color: 'var(--ref-red)',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {prefillNotice && (
          <div
            className="stadium-card flex items-start justify-between"
            style={{
              padding: '10px 14px',
              gap: 12,
              background: 'var(--pitch-tint)',
              borderColor: 'oklch(0.72 0.21 145 / 0.4)',
              color: 'var(--text)',
              fontSize: 12,
            }}
          >
            <span>{prefillNotice}</span>
            <button
              type="button"
              onClick={() => setPrefillNotice(null)}
              className="stadium-btn stadium-btn-ghost"
              style={{ padding: '2px 6px', fontSize: 10, minHeight: 24 }}
              aria-label="Dismiss notice"
            >
              <Icon.Close size={10} />
            </button>
          </div>
        )}

        {/* Coach's pick banner — only when squad is COMPLETELY empty.
            Sarah's #1 ask: brand-new managers stare at 22 empty slots
            and bounce. Give them a one-tap way to land a defensible
            starting XI they can edit from there. */}
        {filledCount === 0 && (
          <div
            className="stadium-card flex flex-wrap items-center justify-between"
            style={{
              padding: '16px 18px',
              gap: 14,
              background: 'var(--pitch-tint)',
              borderColor: 'oklch(0.72 0.21 145 / 0.45)',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="kicker" style={{ color: 'var(--pitch)' }}>
                COACH&apos;S PICK · STARTING XI
              </div>
              <div
                className="display"
                style={{ fontSize: 16, letterSpacing: '-0.02em', marginTop: 4 }}
              >
                New to investing? Tap to fill your starting XI with 11 defensible blue-chips.
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4, lineHeight: 1.5 }}
              >
                You can change anything later.
              </div>
            </div>
            <button
              type="button"
              onClick={applyCoachPick}
              className="stadium-btn stadium-btn-primary"
              style={{ padding: '10px 18px', fontSize: 13, flexShrink: 0 }}
            >
              Sign Coach&apos;s XI
            </button>
          </div>
        )}

        {/* Two-column layout: Starting XI | Bench */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          <SlotColumn
            title="STARTING XI"
            subtitle="The 11 players whose returns count toward your score"
            players={starterPlayers}
            formationPositions={formationPositions}
            effectiveAsset={effectiveAsset}
            pending={pending}
            onEdit={openSlot}
            onClear={clearSlot}
            onCancel={cancelSlotChange}
          />
          <SlotColumn
            title="BENCH (11)"
            subtitle="Reserves you can sub on during weekend windows for 25 XP each"
            players={benchPlayers}
            formationPositions={formationPositions}
            effectiveAsset={effectiveAsset}
            pending={pending}
            onEdit={openSlot}
            onClear={clearSlot}
            onCancel={cancelSlotChange}
          />
        </div>
      </div>

      {/* AssetSelector — opens for whichever slot is being edited */}
      <AssetSelector
        isOpen={!!editingSlot}
        onClose={() => setEditingSlot(null)}
        onSelect={handleAssetSelected}
        position={editingSlot?.position || null}
        currentAsset={editingSlot?.currentAsset || null}
      />

      {/* CSV / JSON paste modal — accepts a freeform list, previews
          valid/unknown/duplicate counts, then confirms into pending. */}
      <Modal
        isOpen={pasteOpen}
        onClose={() => {
          setPasteOpen(false);
          setPasteText('');
          setPastePreview(null);
          setPasteError(null);
        }}
        title="Paste tickers"
        subtitle="UP TO 22 SYMBOLS · COMMA · NEWLINE · JSON ARRAY"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.55 }}>
            Paste tickers in any format — comma list, one-per-line, or a JSON array.
            Unknown symbols are surfaced; duplicates are skipped. Starters fill first.
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.target.value);
              /* Invalidate the preview when the input changes so the
                 user has to re-parse before confirming. */
              if (pastePreview) setPastePreview(null);
              if (pasteError) setPasteError(null);
            }}
            placeholder={'AAPL, MSFT, NVDA\nor\n["AAPL","MSFT","NVDA"]'}
            rows={8}
            style={{
              width: '100%',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '10px 12px',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              resize: 'vertical',
              minHeight: 120,
            }}
          />
          {pasteError && (
            <div
              className="stadium-card"
              style={{
                padding: '10px 12px',
                background: 'oklch(0.65 0.22 25 / 0.08)',
                borderColor: 'oklch(0.65 0.22 25 / 0.3)',
              }}
            >
              <p className="mono" style={{ margin: 0, fontSize: 11, color: 'var(--ref-red)' }}>
                {pasteError}
              </p>
            </div>
          )}
          {pastePreview && (
            <div
              className="stadium-card"
              style={{
                padding: 12,
                background: 'var(--surface-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div className="kicker">PREVIEW</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text)' }}>
                {pastePreview.valid.length} valid
                {pastePreview.unknown.length > 0 ? `, ${pastePreview.unknown.length} unknown` : ''}
                {pastePreview.duplicates.length > 0
                  ? `, ${pastePreview.duplicates.length} duplicate${pastePreview.duplicates.length === 1 ? '' : 's'}`
                  : ''}
                {pastePreview.overflowSymbols.length > 0
                  ? `, ${pastePreview.overflowSymbols.length} won't fit`
                  : ''}
              </div>
              {pastePreview.valid.length > 0 && (
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-mute)', lineHeight: 1.55 }}>
                  Will sign: {pastePreview.valid.map((a) => a.symbol).join(', ')}
                </div>
              )}
              {pastePreview.unknown.length > 0 && (
                <div className="mono" style={{ fontSize: 10, color: 'var(--whistle)', lineHeight: 1.55 }}>
                  Couldn&apos;t find: {pastePreview.unknown.join(', ')}
                </div>
              )}
              {pastePreview.duplicates.length > 0 && (
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-mute)', lineHeight: 1.55 }}>
                  Already in squad: {pastePreview.duplicates.join(', ')}
                </div>
              )}
              {pastePreview.overflowSymbols.length > 0 && (
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-mute)', lineHeight: 1.55 }}>
                  No room for: {pastePreview.overflowSymbols.join(', ')}
                </div>
              )}
            </div>
          )}
          <div className="flex" style={{ gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setPasteOpen(false);
                setPasteText('');
                setPastePreview(null);
                setPasteError(null);
              }}
              className="stadium-btn stadium-btn-ghost"
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
            >
              Cancel
            </button>
            {pastePreview && pastePreview.valid.length > 0 ? (
              <button
                type="button"
                onClick={applyPastePreview}
                className="stadium-btn stadium-btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
              >
                Stage {pastePreview.valid.length} ticker{pastePreview.valid.length === 1 ? '' : 's'}
              </button>
            ) : (
              <button
                type="button"
                onClick={buildPastePreview}
                disabled={pasteBusy || !pasteText.trim()}
                className="stadium-btn stadium-btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
              >
                {pasteBusy ? 'Parsing…' : 'Parse & preview'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

/* ============================================================
   SlotColumn — renders a list of slot cards for one section
   (Starting XI or Bench)
   ============================================================ */
const SlotColumn: React.FC<{
  title: string;
  subtitle: string;
  players: PortfolioPlayer[];
  formationPositions: Position[];
  effectiveAsset: (positionId: string, original: Asset | null) => Asset | null;
  pending: Map<string, Asset | null>;
  onEdit: (player: PortfolioPlayer) => void;
  onClear: (positionId: string) => void;
  onCancel: (positionId: string) => void;
}> = ({ title, subtitle, players, formationPositions, effectiveAsset, pending, onEdit, onClear, onCancel }) => {
  const emptyInSection = players.reduce(
    (n, p) => (effectiveAsset(p.positionId, p.asset) ? n : n + 1),
    0,
  );
  return (
  <div className="stadium-card" style={{ padding: 16 }}>
    <div className="flex items-start justify-between" style={{ gap: 10, marginBottom: 12 }}>
      <div>
        <div className="kicker">{title}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
      <span
        className="mono"
        style={{
          padding: '4px 8px',
          fontSize: 10,
          fontWeight: 700,
          background: emptyInSection === 0 ? 'var(--surface-2)' : 'oklch(0.83 0.18 90 / 0.15)',
          color: emptyInSection === 0 ? 'var(--text-mute)' : 'var(--whistle)',
          border: '1px solid ' + (emptyInSection === 0 ? 'var(--line)' : 'oklch(0.83 0.18 90 / 0.4)'),
          borderRadius: 4,
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}
      >
        {emptyInSection === 0 ? 'FULL' : `${emptyInSection} OPEN`}
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {players.map((player, idx) => {
        const asset = effectiveAsset(player.positionId, player.asset);
        const isPending = pending.has(player.positionId);
        const pos = formationPositions.find((p) => p.id === player.positionId);
        const slotLabel = player.isBench
          ? `Bench ${idx + 1}`
          : pos?.name || player.positionId.toUpperCase();
        const shortLabel = player.isBench ? 'BEN' : pos?.shortName || '—';
        return (
          <motion.div
            key={player.positionId}
            layout
            className="flex items-center"
            style={{
              gap: 12,
              padding: '10px 12px',
              background: asset ? 'var(--surface)' : 'var(--surface-2)',
              border: '1px solid ' + (isPending ? 'var(--pitch)' : 'var(--line)'),
              borderRadius: 8,
            }}
          >
            <div
              className="display"
              style={{
                width: 38,
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-mute)',
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
              title={slotLabel}
            >
              {shortLabel}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {asset ? (
                <>
                  <div
                    className="display"
                    style={{
                      fontSize: 13,
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {asset.symbol}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--text-mute)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {asset.name}
                  </div>
                </>
              ) : (
                <div
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.04em' }}
                >
                  empty slot
                </div>
              )}
            </div>
            <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => onEdit(player)}
                className="stadium-btn stadium-btn-ghost"
                style={{ padding: '6px 10px', fontSize: 11, minHeight: 32 }}
              >
                {asset ? 'Change' : 'Choose'}
              </button>
              {isPending && (
                <button
                  type="button"
                  onClick={() => onCancel(player.positionId)}
                  title="Discard pending change for this slot"
                  className="stadium-btn stadium-btn-ghost"
                  style={{
                    padding: '6px 8px',
                    fontSize: 10,
                    minHeight: 32,
                    color: 'var(--text-mute)',
                  }}
                >
                  Undo
                </button>
              )}
              {asset && !isPending && (
                <button
                  type="button"
                  onClick={() => onClear(player.positionId)}
                  title="Remove this player from the slot"
                  className="stadium-btn stadium-btn-ghost"
                  style={{
                    padding: '6px',
                    minHeight: 32,
                    color: 'var(--text-mute)',
                  }}
                >
                  <Icon.Close size={12} />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
  );
};
