import { ROLE_ORDER, sortPlayersByAuctionOrder, getCurrentAuctionPhase } from './auctionUtils';

const player = (Name, Role, BaseTokens = 35) => ({ Name, Role, BaseTokens });

describe('auction running order', () => {
  it('opens with wicket-keepers', () => {
    expect(ROLE_ORDER[0]).toBe('WicketKeeper');
  });

  it('runs the remaining categories after them', () => {
    expect(ROLE_ORDER).toEqual(['WicketKeeper', 'Batsman', 'Bowler', 'All-rounder']);
  });

  it('sorts keepers to the front regardless of input order', () => {
    const sorted = sortPlayersByAuctionOrder([
      player('Bat', 'Batsman'), player('AR', 'All-rounder'),
      player('Keeper', 'WicketKeeper'), player('Bowl', 'Bowler')
    ]);
    expect(sorted.map(p => p.Role)).toEqual(['WicketKeeper', 'Batsman', 'Bowler', 'All-rounder']);
  });

  it('still ranks by BaseTokens within a category', () => {
    const sorted = sortPlayersByAuctionOrder([
      player('Cheap', 'WicketKeeper', 35),
      player('Marquee', 'WicketKeeper', 75),
      player('Mid', 'WicketKeeper', 50)
    ]);
    expect(sorted.map(p => p.Name)).toEqual(['Marquee', 'Mid', 'Cheap']);
  });

  it('numbers the keeper phase as phase 1 of 4', () => {
    const players = sortPlayersByAuctionOrder([player('Keeper', 'WicketKeeper'), player('Bat', 'Batsman')]);
    const phase = getCurrentAuctionPhase(players, 0);
    expect(phase.role).toBe('WicketKeeper');
    expect(phase.phase).toBe(1);
    expect(phase.totalPhases).toBe(4);
  });
});
