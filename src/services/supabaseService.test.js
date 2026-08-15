/**
 * Wiring tests for the pre-auction guard inside supabaseService.
 *
 * preAuctionGuard.test.js only proves the pure filter works. These tests prove
 * uploadExcelData / mergeExcelData actually use it: that locked player IDs are
 * excluded from what gets written, and that the teams write is an upsert (so it
 * does not blow up on teams that already exist from uploadPreAuctionSquads).
 *
 * @supabase/supabase-js is mocked so no network call is ever made and no real
 * env vars are read.
 */

process.env.REACT_APP_SUPABASE_URL = 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'dummy-anon-key';

// The mock is built entirely inside the jest.mock factory (rather than closing
// over an outer variable) because jest.mock() factories are hoisted above
// other module-scope declarations — closing over an outer `const` here would
// capture it before it's initialized, and supabase.from() would resolve to
// undefined at runtime. State is instead exposed as a property on the mocked
// module itself and retrieved via a fresh require() after jest.mock runs.
jest.mock('@supabase/supabase-js', () => {
  // Records every call made against the mock Supabase client so assertions
  // can inspect exactly what was sent to which table via which method.
  const callLog = [];
  // Per-table, per-operation canned responses. Defaults to { data: [], error: null }.
  const responses = {};

  function makeQueryBuilder(table) {
    let op = null;

    const resolveResult = () => {
      const forTable = responses[table] || {};
      const configured = op && forTable[op];
      if (typeof configured === 'function') return configured();
      if (configured) return configured;
      return { data: [], error: null };
    };

    const builder = {
      select(...args) {
        op = op || 'select';
        callLog.push({ table, method: 'select', args });
        return builder;
      },
      eq(...args) {
        callLog.push({ table, method: 'eq', args });
        return builder;
      },
      neq(...args) {
        callLog.push({ table, method: 'neq', args });
        return builder;
      },
      or(...args) {
        callLog.push({ table, method: 'or', args });
        return builder;
      },
      delete(...args) {
        op = 'delete';
        callLog.push({ table, method: 'delete', args });
        return builder;
      },
      insert(...args) {
        op = 'insert';
        callLog.push({ table, method: 'insert', args });
        return builder;
      },
      upsert(...args) {
        op = 'upsert';
        callLog.push({ table, method: 'upsert', args });
        return builder;
      },
      update(...args) {
        op = 'update';
        callLog.push({ table, method: 'update', args });
        return builder;
      },
      single() {
        callLog.push({ table, method: 'single', args: [] });
        return Promise.resolve(resolveResult());
      },
      then(resolve, reject) {
        return Promise.resolve(resolveResult()).then(resolve, reject);
      }
    };

    return builder;
  }

  const client = { from: (table) => makeQueryBuilder(table) };

  return {
    createClient: () => client,
    __mockState: { callLog, responses }
  };
});

const { supabaseAuctionService } = require('./supabaseService');
const { CPL_2026 } = require('../config/cpl2026');
const { __mockState: mockState } = require('@supabase/supabase-js');

function findCalls(table, method) {
  return mockState.callLog.filter(c => c.table === table && c.method === method);
}

beforeEach(() => {
  mockState.callLog.length = 0;
  for (const key of Object.keys(mockState.responses)) delete mockState.responses[key];
});

describe('uploadExcelData', () => {
  const teams = [{ TeamID: 1, TeamName: 'Alpha', LogoFile: null }];
  const players = [
    { PlayerID: 'P1', Name: 'Locked Player', Role: 'Batsman', BaseTokens: 10 },
    { PlayerID: 'P2', Name: 'New Player', Role: 'Bowler', BaseTokens: 10 }
  ];

  test('excludes every locked pre-auction player ID from the players write', async () => {
    mockState.responses.players = {
      select: { data: [{ player_id: 'P1' }], error: null }
    };

    await supabaseAuctionService.uploadExcelData(players, teams);

    const insertCalls = findCalls('players', 'insert');
    expect(insertCalls).toHaveLength(1);
    const writtenIds = insertCalls[0].args[0].map(row => row.player_id);
    expect(writtenIds).not.toContain('P1');
    expect(writtenIds).toContain('P2');
  });

  test('teams are written via upsert, not insert, so pre-existing teams do not fail', async () => {
    mockState.responses.players = {
      select: { data: [{ player_id: 'P1' }], error: null }
    };

    await supabaseAuctionService.uploadExcelData(players, teams);

    expect(findCalls('teams', 'upsert')).toHaveLength(1);
    expect(findCalls('teams', 'insert')).toHaveLength(0);
  });

  test('teams write sources budget figures from CPL_2026, not hardcoded values', async () => {
    mockState.responses.players = {
      select: { data: [{ player_id: 'P1' }], error: null }
    };

    await supabaseAuctionService.uploadExcelData(players, teams);

    const teamRow = findCalls('teams', 'upsert')[0].args[0][0];
    expect(teamRow.max_tokens).toBe(CPL_2026.auctionBudget);
    expect(teamRow.tokens_left).toBe(CPL_2026.auctionBudget);
    expect(teamRow.max_squad_size).toBe(CPL_2026.defaultSquadSize);
    expect(teamRow.batsman_budget_remaining).toBe(CPL_2026.advisoryCategorySpend['Batsman']);
    expect(teamRow.bowler_budget_remaining).toBe(CPL_2026.advisoryCategorySpend['Bowler']);
    expect(teamRow.allrounder_budget_remaining).toBe(CPL_2026.advisoryCategorySpend['All-rounder']);
    expect(teamRow.wicketkeeper_budget_remaining).toBe(CPL_2026.advisoryCategorySpend['WicketKeeper']);
  });

  test('uses a NULL-safe delete predicate when locked players exist', async () => {
    mockState.responses.players = {
      select: { data: [{ player_id: 'P1' }], error: null }
    };

    await supabaseAuctionService.uploadExcelData(players, teams);

    // The delete must be filtered via .or(), not a bare .neq() which silently
    // skips NULL-status rows in Postgres.
    expect(findCalls('players', 'or')).toHaveLength(1);
    expect(findCalls('players', 'or')[0].args[0]).toBe('status.is.null,status.neq.PreAuction');
    expect(findCalls('players', 'neq').filter(c => c.args[0] === 'status')).toHaveLength(0);
  });
});

describe('mergeExcelData', () => {
  const teams = [{ TeamID: 1, TeamName: 'Alpha', LogoFile: null }];
  const players = [
    { PlayerID: 'P1', Name: 'Locked Player', Role: 'Batsman', BaseTokens: 10 },
    { PlayerID: 'P2', Name: 'New Player', Role: 'Bowler', BaseTokens: 10 }
  ];

  test('excludes every locked pre-auction player ID from the players write', async () => {
    mockState.responses.players = {
      select: { data: [{ player_id: 'P1' }], error: null }
    };

    await supabaseAuctionService.mergeExcelData(players, teams);

    const upsertCalls = findCalls('players', 'upsert');
    expect(upsertCalls).toHaveLength(1);
    const writtenIds = upsertCalls[0].args[0].map(row => row.player_id);
    expect(writtenIds).not.toContain('P1');
    expect(writtenIds).toContain('P2');
  });

  test('teams write sources budget figures from CPL_2026, not hardcoded values', async () => {
    mockState.responses.players = {
      select: { data: [], error: null }
    };

    await supabaseAuctionService.mergeExcelData(players, teams);

    const teamRow = findCalls('teams', 'upsert')[0].args[0][0];
    expect(teamRow.max_tokens).toBe(CPL_2026.auctionBudget);
    expect(teamRow.tokens_left).toBe(CPL_2026.auctionBudget);
    expect(teamRow.max_squad_size).toBe(CPL_2026.defaultSquadSize);
  });
});
