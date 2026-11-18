<script>
  // Ranking de semana, mes o siempre: general o por juego. Puntos 3-2-1 por puesto + victorias.
  import { onMount } from 'svelte';
  import { loadGames } from '../lib/games.js';
  import { loadResultsBetween } from '../lib/results.js';
  import { standings, periodStart } from '../lib/standings.js';
  import { madridToday } from '../lib/day.js';
  import { humanError } from '../lib/account.js';

  let { profile } = $props();
  const today = madridToday();
  const PERIODS = [['week', 'Semana'], ['month', 'Mes'], ['all', 'Siempre']];
  let period = $state('week');
  let gameId = $state(null);          // null = general
  let games = $state([]);
  let rows = $state([]);
  let error = $state('');
  let loaded = $state(false);

  const betterOf = (id) => games.find((g) => g.id === id)?.better ?? 'low';
  const table = $derived(standings(gameId ? rows.filter((r) => r.game_id === gameId) : rows, betterOf));
  const podium = $derived([table[1], table[0], table[2]].filter(Boolean));
  const rest = $derived(table.slice(3));

  async function load() {
    loaded = false; error = '';
    try {
      if (!games.length) games = await loadGames();
      rows = await loadResultsBetween(periodStart(period, today), today);
    } catch (e) { error = humanError(e); }
    loaded = true;
  }
  function setPeriod(p) { period = p; load(); }
  onMount(load);
</script>

<main class="page fade-in">
  <h1>Ranking</h1>

  <div class="seg" role="group" aria-label="Periodo">
    {#each PERIODS as [id, label]}
      <button aria-pressed={period === id} onclick={() => setPeriod(id)}>{label}</button>
    {/each}
  </div>

  <div class="chips" role="group" aria-label="Juego">
    <button aria-pressed={gameId === null} onclick={() => (gameId = null)}>General</button>
    {#each games as g (g.id)}
      <button aria-pressed={gameId === g.id} onclick={() => (gameId = g.id)}>{g.emoji} {g.name}</button>
    {/each}
  </div>

  {#if error}<p class="error">{error}</p>{/if}

  {#if loaded && !table.length}
    <p class="lead">Aún no hay resultados en este periodo. El ranking cuenta hasta ayer: lo de hoy entra cuando acaba el día.</p>
  {:else if loaded}
    <div class="podium" aria-label="Podio">
      {#each podium as p (p.user_id)}
        <div class="pcol">
          <span class="pav p{p.pos}">{p.name.charAt(0).toUpperCase()}</span>
          <span class="pname">{p.name}{p.user_id === profile.id ? ' (tú)' : ''}</span>
          <div class="pblock p{p.pos}" style="height:{p.pos === 1 ? 146 : p.pos === 2 ? 112 : 92}px">
            <span class="num ppos">{p.pos}º</span>
            <span class="pts">{p.points} pts</span>
            <span class="wins">{p.wins} {p.wins === 1 ? 'victoria' : 'victorias'}</span>
          </div>
        </div>
      {/each}
    </div>

    {#if rest.length}
      <ol class="group">
        <li class="row thead"><span class="c1">#</span><span class="grow">Jugador</span><span class="c2">Victorias</span><span class="c3">Puntos</span></li>
        {#each rest as t (t.user_id)}
          <li class="row" class:me={t.user_id === profile.id}><span class="c1">{t.pos}</span><span class="grow name">{t.name}</span><span class="c2">{t.wins}</span><span class="c3 num">{t.points}</span></li>
        {/each}
      </ol>
    {/if}
    <p class="small muted">Cada juego y día: 1º = 3 pts, 2º = 2 pts, 3º = 1 pt. Los empates comparten puesto y puntos. Cuenta hasta ayer.</p>
  {/if}
</main>

<style>
  .seg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: var(--line); border-radius: 12px; padding: 3px; height: 44px; margin: 16px 0 12px; }
  .seg button { border: 0; border-radius: 9px; background: transparent; color: var(--muted); font-weight: 600; font-size: 14px; cursor: pointer; }
  .seg button[aria-pressed='true'] { background: var(--surface); color: var(--ink); font-weight: 700; box-shadow: 0 1px 3px rgba(21,19,43,.12); }
  .chips { display: flex; gap: 8px; overflow-x: auto; margin: 0 -16px 8px; padding: 2px 16px 6px; scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
  .chips button { flex: none; height: 38px; padding: 0 14px; border-radius: 19px; border: 1px solid var(--line); background: var(--surface); font-weight: 600; font-size: 14px; white-space: nowrap; cursor: pointer; }
  .chips button[aria-pressed='true'] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .podium { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; gap: 8px; margin: 18px 0 14px; }
  .pcol { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
  .pav { width: 44px; height: 44px; border-radius: 50%; background: var(--ink); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; border: 3px solid var(--line); }
  .pav.p1 { border-color: var(--gold); } .pav.p2 { border-color: var(--silver); } .pav.p3 { border-color: var(--bronze); }
  .pname { font-weight: 700; font-size: 14px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pblock { width: 100%; border-radius: 14px 14px 6px 6px; display: flex; flex-direction: column; align-items: center; padding-top: 12px; gap: 2px; background: var(--line); animation: grow .4s ease-out; transform-origin: bottom; }
  .pblock.p1 { background: var(--gold); color: #3A2A00; } .pblock.p2 { background: var(--silver); color: #22242C; } .pblock.p3 { background: var(--bronze); color: #2E1600; }
  .ppos { font-size: 28px; line-height: 1; }
  .pts { font-size: 13px; font-weight: 700; } .wins { font-size: 12px; font-weight: 600; opacity: .85; }
  @keyframes grow { from { transform: scaleY(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .pblock { animation: none; } }
  ol.group { padding: 0; }
  .thead { font-size: 12px; font-weight: 600; color: var(--muted); padding-top: 8px; padding-bottom: 8px; }
  .c1 { width: 22px; font-weight: 700; color: var(--muted); } .c2 { width: 64px; text-align: right; } .c3 { width: 52px; text-align: right; font-size: 18px; }
  .thead .c3 { font-size: 12px; }
  .me { background: color-mix(in srgb, var(--accent) 12%, transparent); }
</style>
