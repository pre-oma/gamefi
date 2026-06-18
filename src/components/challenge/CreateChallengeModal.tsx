'use client';

import React, { useCallback, useState } from 'react';
import {
  ChallengeType,
  ChallengeTimeframe,
  CHALLENGE_XP,
  CHALLENGE_TIMEFRAMES,
  CHALLENGE_TIMEFRAME_XP_MULT,
  MAX_ACTIVE_CHALLENGES,
} from '@/types';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui';
import { Icon } from '@/components/stadium/Icon';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* Base XP at stake (before timeframe multiplier). */
function baseXpForType(type: ChallengeType): number {
  if (type === 'sp500') return CHALLENGE_XP.VS_SP500;
  if (type === 'etf') return CHALLENGE_XP.VS_ETF;
  return CHALLENGE_XP.VS_USER;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    portfolios,
    publicPortfolios,
    createChallenge,
    canCreateChallenge,
    getActiveChallengesCount,
  } = useStore();

  const [challengeType, setChallengeType] = useState<ChallengeType>('sp500');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChallengeTimeframe>('1W');
  const [opponentPortfolioId, setOpponentPortfolioId] = useState('');

  /* ETF ticker state — separate from the validated symbol so users can
     type freely without spamming Yahoo lookups. We validate on Add. */
  const [etfInput, setEtfInput] = useState('');
  const [etfSymbol, setEtfSymbol] = useState<string | null>(null);
  const [etfName, setEtfName] = useState<string | null>(null);
  const [etfValidating, setEtfValidating] = useState(false);
  const [etfError, setEtfError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCount = getActiveChallengesCount();
  const baseXp = baseXpForType(challengeType);
  const multiplier = CHALLENGE_TIMEFRAME_XP_MULT[selectedTimeframe] ?? 1.0;
  const totalXp = Math.round(baseXp * multiplier);
  const canCreate = canCreateChallenge(challengeType);

  const opponentPortfolios = publicPortfolios.filter((p) => p.userId !== currentUser?.id);

  const resetForm = useCallback(() => {
    setChallengeType('sp500');
    setSelectedPortfolioId('');
    setSelectedTimeframe('1W');
    setOpponentPortfolioId('');
    setEtfInput('');
    setEtfSymbol(null);
    setEtfName(null);
    setEtfValidating(false);
    setEtfError(null);
    setError(null);
  }, []);

  const handleClose = () => {
    onClose();
    resetForm();
  };

  /* Validate ETF ticker against Yahoo before letting the user submit.
     Mirrors CustomSymbolSearch.tsx — uses /api/yahoo-finance which
     returns { success, asset } on valid tickers. */
  const handleAddEtf = useCallback(async () => {
    const candidate = etfInput.trim().toUpperCase();
    if (!candidate) return;
    setEtfValidating(true);
    setEtfError(null);
    try {
      const response = await fetch(
        `/api/yahoo-finance?symbol=${encodeURIComponent(candidate)}`,
      );
      const data = await response.json();
      if (!data.success || !data.asset) {
        setEtfError('Symbol not found');
        return;
      }
      setEtfSymbol(data.asset.symbol);
      setEtfName(data.asset.name);
      setEtfInput(data.asset.symbol);
    } catch {
      setEtfError('Failed to validate symbol');
    } finally {
      setEtfValidating(false);
    }
  }, [etfInput]);

  const handleClearEtf = () => {
    setEtfSymbol(null);
    setEtfName(null);
    setEtfInput('');
    setEtfError(null);
  };

  const handleCreate = async () => {
    if (!selectedPortfolioId) {
      setError('Please pick your squad');
      return;
    }
    if (challengeType === 'user' && !opponentPortfolioId) {
      setError('Please pick an opponent squad');
      return;
    }
    if (challengeType === 'etf' && !etfSymbol) {
      setError('Please enter and validate an ETF ticker');
      return;
    }

    setIsLoading(true);
    setError(null);

    const opponentPortfolio = opponentPortfolios.find((p) => p.id === opponentPortfolioId);
    const result = await createChallenge(
      selectedPortfolioId,
      challengeType,
      selectedTimeframe,
      opponentPortfolio?.userId,
      opponentPortfolioId || undefined,
      challengeType === 'etf' ? etfSymbol || undefined : undefined,
    );

    setIsLoading(false);

    if (result.success) {
      handleClose();
    } else {
      setError(result.error || 'Failed to set up the fixture');
    }
  };

  const summaryType =
    challengeType === 'sp500'
      ? 'vs S&P 500'
      : challengeType === 'etf'
      ? `vs ${etfSymbol || 'ETF'}`
      : 'vs Manager';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New fixture"
      subtitle={`FIXTURES · ${activeCount} / ${MAX_ACTIVE_CHALLENGES} ACTIVE`}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {error && (
          <Banner tone="error">{error}</Banner>
        )}

        {!canCreate.canCreate && (
          <Banner tone="warn">{canCreate.reason}</Banner>
        )}

        {/* Fixture type */}
        <div>
          <Label>Fixture type</Label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
            }}
          >
            <TypeCard
              icon="Bolt"
              code="BMK"
              pillClass="pill pill-whistle"
              title="vs S&P 500"
              sub="Beat the market index over your chosen timeframe."
              xp={CHALLENGE_XP.VS_SP500}
              active={challengeType === 'sp500'}
              onClick={() => setChallengeType('sp500')}
            />
            <TypeCard
              icon="Bolt"
              code="ETF"
              pillClass="pill pill-sky"
              title="vs ETF"
              sub="Pick any ETF or stock as the benchmark (QQQ, VTI, ARKK…)."
              xp={CHALLENGE_XP.VS_ETF}
              active={challengeType === 'etf'}
              onClick={() => setChallengeType('etf')}
            />
            <TypeCard
              icon="Profile"
              code="PVP"
              pillClass="pill pill-pitch"
              title="vs Manager"
              sub="Head-to-head with another manager's squad."
              xp={CHALLENGE_XP.VS_USER}
              active={challengeType === 'user'}
              onClick={() => setChallengeType('user')}
            />
          </div>
        </div>

        {/* ETF ticker picker (only for vs ETF) */}
        {challengeType === 'etf' && (
          <div>
            <Label>Benchmark ticker</Label>
            {etfSymbol ? (
              <div
                className="stadium-card"
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  background: 'var(--surface-2)',
                }}
              >
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="pill pill-sky" style={{ padding: '2px 8px' }}>
                    {etfSymbol}
                  </span>
                  {etfName && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: 'var(--text-dim)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {etfName}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearEtf}
                  className="stadium-btn stadium-btn-ghost"
                  style={{ padding: '4px 10px', fontSize: 11 }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={etfInput}
                    onChange={(e) => {
                      setEtfInput(e.target.value.toUpperCase());
                      setEtfError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEtf();
                      }
                    }}
                    placeholder="Enter ticker (e.g. QQQ, ARKK, VTI)"
                    disabled={etfValidating}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddEtf}
                    disabled={etfValidating || !etfInput.trim()}
                    className="stadium-btn stadium-btn-primary"
                    style={{ padding: '8px 16px', fontSize: 12 }}
                  >
                    {etfValidating ? 'Checking…' : 'Add'}
                  </button>
                </div>
                {etfError && (
                  <span
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--ref-red)' }}
                  >
                    {etfError}
                  </span>
                )}
                <span
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.04em' }}
                >
                  Any Yahoo-listed stock, ETF, or index ticker works.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Your squad */}
        <div>
          <Label>Your squad</Label>
          <SquadSelect
            value={selectedPortfolioId}
            onChange={setSelectedPortfolioId}
            options={portfolios.map((p) => ({
              id: p.id,
              label: p.name,
              formation: p.formation,
            }))}
            placeholder="Pick a squad to field"
          />
        </div>

        {/* Timeframe */}
        <div>
          <Label>Timeframe</Label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6,
            }}
          >
            {CHALLENGE_TIMEFRAMES.map((tf) => {
              const isActive = selectedTimeframe === tf.value;
              const mult = CHALLENGE_TIMEFRAME_XP_MULT[tf.value];
              return (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => setSelectedTimeframe(tf.value)}
                  className="mono"
                  style={{
                    padding: '10px 6px',
                    background: isActive ? 'var(--pitch)' : 'var(--surface-2)',
                    color: isActive ? 'oklch(0.14 0.05 145)' : 'var(--text-dim)',
                    border: '1px solid ' + (isActive ? 'var(--pitch-deep)' : 'var(--line)'),
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    transition: 'background .12s, border-color .12s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <span>{tf.label}</span>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>×{mult}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Opponent (only for vs user) */}
        {challengeType === 'user' && (
          <div>
            <Label>Opponent squad</Label>
            {opponentPortfolios.length === 0 ? (
              <div
                className="stadium-card"
                style={{
                  padding: '14px 16px',
                  borderStyle: 'dashed',
                  textAlign: 'center',
                }}
              >
                <div className="kicker">NO PUBLIC SQUADS YET TO CHALLENGE</div>
              </div>
            ) : (
              <SquadSelect
                value={opponentPortfolioId}
                onChange={setOpponentPortfolioId}
                options={opponentPortfolios.map((p) => ({
                  id: p.id,
                  label: p.name,
                  formation: p.formation,
                }))}
                placeholder="Pick a rival squad"
              />
            )}
          </div>
        )}

        {/* Summary */}
        <div
          className="stadium-card"
          style={{
            padding: 14,
            background: 'var(--surface-2)',
          }}
        >
          <div className="kicker" style={{ marginBottom: 10 }}>FIXTURE SUMMARY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SummaryRow label="Type" value={summaryType} />
            <SummaryRow
              label="Timeframe"
              value={CHALLENGE_TIMEFRAMES.find((t) => t.value === selectedTimeframe)?.label || selectedTimeframe}
            />
            <SummaryRow
              label="XP at stake"
              value={`+${baseXp} × ${multiplier}x = ${totalXp} XP`}
              valueColor="var(--whistle)"
            />
            {currentUser && (
              <SummaryRow
                label="Your XP"
                value={`${currentUser.xp.toLocaleString()} XP`}
                divider
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex" style={{ gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className="stadium-btn stadium-btn-ghost"
            style={{ flex: 1, justifyContent: 'center', padding: '11px 14px' }}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="stadium-btn stadium-btn-primary"
            style={{ flex: 1.4, justifyContent: 'center', padding: '11px 14px' }}
            onClick={handleCreate}
            disabled={
              isLoading ||
              !canCreate.canCreate ||
              !selectedPortfolioId ||
              (challengeType === 'user' && !opponentPortfolioId) ||
              (challengeType === 'etf' && !etfSymbol)
            }
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'stadium-spin 0.9s linear infinite',
                  }}
                />
                Setting up…
              </>
            ) : (
              <>
                <Icon.Whistle size={14} /> Kick off fixture
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ============================================================ */

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label
    className="kicker"
    style={{ display: 'block', marginBottom: 8, color: 'var(--text-dim)' }}
  >
    {children}
  </label>
);

const Banner: React.FC<{ tone: 'error' | 'warn'; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    className="stadium-card"
    style={{
      padding: '10px 12px',
      background:
        tone === 'error' ? 'oklch(0.65 0.22 25 / 0.08)' : 'oklch(0.83 0.18 90 / 0.1)',
      borderColor:
        tone === 'error' ? 'oklch(0.65 0.22 25 / 0.3)' : 'oklch(0.83 0.18 90 / 0.3)',
    }}
  >
    <p
      className="mono"
      style={{
        margin: 0,
        fontSize: 11,
        color: tone === 'error' ? 'var(--ref-red)' : 'var(--whistle)',
        letterSpacing: '0.02em',
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  </div>
);

const TypeCard: React.FC<{
  icon: 'Bolt' | 'Profile';
  code: string;
  pillClass: string;
  title: string;
  sub: string;
  xp: number;
  active: boolean;
  onClick: () => void;
}> = ({ icon, code, pillClass, title, sub, xp, active, onClick }) => {
  const IconCmp = Icon[icon];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 14,
        background: active ? 'var(--pitch-tint)' : 'var(--surface-2)',
        border: '1px solid ' + (active ? 'var(--pitch)' : 'var(--line)'),
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'background .12s, border-color .12s',
      }}
    >
      <div className="flex items-center justify-between">
        <span className={pillClass} style={{ padding: '2px 6px' }}>
          {code}
        </span>
        <IconCmp size={18} style={{ color: active ? 'var(--pitch)' : 'var(--text-dim)' }} />
      </div>
      <div className="display" style={{ fontSize: 15, letterSpacing: '-0.02em' }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
        {sub}
      </div>
      <div
        className="mono num"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--whistle)',
          marginTop: 2,
        }}
      >
        +{xp} XP
      </div>
    </button>
  );
};

const SquadSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; formation: string }[];
  placeholder: string;
}> = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '10px 14px',
      background: 'var(--surface-2)',
      border: '1px solid var(--line)',
      borderRadius: 8,
      color: 'var(--text)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none',
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23808890' stroke-width='2'><path d='M6 9 L12 15 L18 9'/></svg>\")",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      paddingRight: 34,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = 'var(--pitch)';
      e.currentTarget.style.background = 'var(--surface)';
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = 'var(--line)';
      e.currentTarget.style.background = 'var(--surface-2)';
    }}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt.label} ({opt.formation})
      </option>
    ))}
  </select>
);

const SummaryRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
  divider?: boolean;
}> = ({ label, value, valueColor, divider }) => (
  <div
    className="flex justify-between items-center"
    style={{
      paddingTop: divider ? 6 : 0,
      borderTop: divider ? '1px solid var(--line)' : 'none',
      marginTop: divider ? 4 : 0,
    }}
  >
    <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
      {label}
    </span>
    <span
      className="display num"
      style={{
        fontSize: 13,
        color: valueColor || 'var(--text)',
        letterSpacing: '-0.01em',
      }}
    >
      {value}
    </span>
  </div>
);
