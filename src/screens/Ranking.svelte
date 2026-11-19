<script>
  // Ranking de semana, mes o siempre: general o por juego. Puntos 3-2-1 por puesto + victorias.
  import { onMount } from 'svelte';
  import { loadGames } from '../lib/games.js';
  import { loadStandings, loadResultsBetween, rank } from '../lib/results.js';
  import { placeTable, periodStart, POINTS } from '../lib/standings.js';
  import { madridToday } from '../lib/day.js';
  import { humanError } from '../lib/account.js';
  import { loadSeasonStart } from '../lib/admin.js';

  let { profile } = $props();
  const today = madridToday();
  const PERIODS = [['week', 'Semana'], ['month', 'Mes'], ['all', 'Siempre']];
  let period = $state('week');
  let gameId = $state(null);          // null = general
  let scope = $state('t1');           // ranking general: 't1' (solo imprescindibles) o 'all' (todos)
  let games = $state([]);
  let rows = $state([]);
  let season = $state('2000-01-01');
  let visible = $state([]);           // resultados que puedo ver (los de hoy, solo de juegos que ya he jugado)
  let error = $state('');
  let loaded = $state(false);

  const table = $derived(placeTable(rows));
  const podium = $derived([table[1], table[0], table[2]].filter(Boolean));
  const rest = $derived(table.slice(3));

  // Detalle por jugador: cada resultado del periodo con su puesto y puntos en ese juego y día.
  const gameOf = (id) => games.find((g) => g.id === id);
  const detail = $derived.by(() => {
    const keep = visible.filter((r) => gameId ? r.game_id === gameId : scope === 't1' ? (gameOf(r.game_id)?.tier ?? 2) === 1 : true);
    const groups = new Map();
    for (const r of keep) { const k = r.game_id + '|' + r.day; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
    const byUser = new Map();
    for (const list of groups.values()) {
      for (const r of rank(list, gameOf(list[0].game_id)?.better ?? 'low')) {
        if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
        byUser.get(r.user_id).push({ ...r, pts: POINTS[r.pos] || 0, game: gameOf(r.game_id) });
      }
    }
    for (const list of byUser.values()) list.sort((a, b) => b.day.localeCompare(a.day) || (a.game?.sort ?? 0) - (b.game?.sort ?? 0));
    return byUser;
  });
  const yesterday = (() => { const d = new Date(today + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); })();
  const tomorrow = (() => { const d = new Date(today + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })();
  const dayLabel = (d) => d === today ? 'Hoy' : d === yesterday ? 'Ayer' : new Date(d + 'T12:00:00Z').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

  async function load() {
    loaded = false; error = '';
    try {
      if (!games.length) [games, season] = await Promise.all([loadGames(), loadSeasonStart()]);
      [rows, visible] = await Promise.all([
        loadStandings(periodStart(period, today), gameId, gameId === null && scope === 't1' ? 1 : null),
        loadResultsBetween(periodStart(period, today) > season ? periodStart(period, today) : season, tomorrow)
      ]);
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
    <button aria-pressed={gameId === null} onclick={() => { gameId = null; load(); }}>General</button>
    {#each games as g (g.id)}
      <button aria-pressed={gameId === g.id} onclick={() => { gameId = g.id; load(); }}>{g.emoji} {g.name}</button>
    {/each}
  </div>

  {#if gameId === null}
    <div class="scope" role="radiogroup" aria-label="Juegos que cuentan">
      <button role="radio" aria-checked={scope === 't1'} onclick={() => { scope = 't1'; load(); }}>Solo T1</button>
      <button role="radio" aria-checked={scope === 'all'} onclick={() => { scope = 'all'; load(); }}>Todos los juegos</button>
    </div>
  {/if}

  {#if error}<p class="error">{error}</p>{/if}

  {#if loaded && !table.length}
    <p class="lead">Aún no hay resultados en este periodo.</p>
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
    <h2 class="dh">Detalle por jugador</h2>
    {#each table as t (t.user_id)}
      {@const list = detail.get(t.user_id) ?? []}
      {@const hidden = Math.max(0, t.played - list.length)}
      <details class="det" open={t.user_id === profile.id}>
        <summary>
          <span class="medal {t.pos <= 3 ? 'p' + t.pos : ''}">{t.pos}</span>
          <span class="grow name">{t.name}{t.user_id === profile.id ? ' (tú)' : ''}</span>
          <span class="muted small">{t.played} {t.played === 1 ? 'partida' : 'partidas'}</span>
          <span class="num spts">{t.points} {t.points === 1 ? 'pt' : 'pts'}</span>
          <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>
        </summary>
        <ul>
          {#each list as r (r.id)}
            <li>
              <span class="dday">{dayLabel(r.day)}</span>
              <span class="dgame">{#if !gameId}<span aria-hidden="true">{r.game?.emoji}</span> {r.game?.name}{/if}</span>
              <span class="dval">{r.display}</span>
              <span class="dpos" class:win={r.pos === 1}>{r.pos ? `${r.pos}º` : '—'}{r.pts ? ` · ${r.pts} ${r.pts === 1 ? 'pt' : 'pts'}` : ''}</span>
            </li>
          {/each}
          {#if hidden}
            <li class="hiddenr">{hidden} {hidden === 1 ? 'resultado de hoy oculto' : 'resultados de hoy ocultos'} hasta que juegues {hidden === 1 ? 'ese juego' : 'esos juegos'}</li>
          {/if}
        </ul>
      </details>
    {/each}

    {#if season > '2000-01-01'}<p class="small muted">Temporada desde el {new Date(season + 'T12:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}.</p>{/if}
    <p class="small muted">{gameId === null ? (scope === 't1' ? 'Cuentan solo los juegos T1. ' : 'Cuentan todos los juegos. ') : ''}Cada juego y día: 1º = 3 pts, 2º = 2 pts, 3º = 1 pt. Los empates comparten puesto y puntos. Incluye los resultados de hoy.</p>
  {/if}
</main>

<style>
  .seg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: var(--line); border-radius: 12px; padding: 3px; height: 44px; margin: 16px 0 12px; }
  .seg button { border: 0; border-radius: 9px; background: transparent; color: var(--muted); font-weight: 600; font-size: 14px; cursor: pointer; }
  .seg button[aria-pressed='true'] { background: var(--surface); color: var(--ink); font-weight: 700; box-shadow: 0 1px 3px rgba(11,11,11,.12); }
  .chips { display: flex; gap: 8px; overflow-x: auto; margin: 0 -16px 8px; padding: 2px 16px 6px; scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
  .chips button { flex: none; height: 38px; padding: 0 14px; border-radius: 19px; border: 1px solid var(--line); background: var(--surface); font-weight: 600; font-size: 14px; white-space: nowrap; cursor: pointer; }
  .chips button[aria-pressed='true'] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .scope { display: flex; gap: 8px; margin: 4px 0 4px; }
  .scope button { flex: 1; height: 38px; border-radius: 10px; border: 1.5px solid var(--line); background: transparent; color: var(--muted); font-weight: 600; font-size: 14px; cursor: pointer; }
  .scope button[aria-checked='true'] { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); font-weight: 700; }
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
  .dh { margin-top: 28px; }
  .det { background: var(--surface); border-radius: 16px; margin-bottom: 8px; overflow: hidden; }
  .det summary { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; list-style: none; min-height: 52px; }
  .det summary::-webkit-details-marker { display: none; }
  .det .grow { flex: 1; min-width: 0; }
  .spts { font-size: 16px; min-width: 52px; text-align: right; }
  .chev { color: var(--muted); transition: transform .2s ease; flex: none; }
  .det[open] .chev { transform: rotate(180deg); }
  .det ul { list-style: none; margin: 0; padding: 0 14px 10px; }
  .det li { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto auto; gap: 10px; align-items: center; padding: 9px 0; border-top: 1px solid var(--line); font-size: 14px; }
  .dday { color: var(--muted); font-size: 13px; text-transform: capitalize; }
  .dgame { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dval { font-weight: 650; white-space: nowrap; }
  .dpos { font-size: 12px; font-weight: 650; color: var(--muted); white-space: nowrap; min-width: 64px; text-align: right; }
  .dpos.win { color: var(--done); }
  .det li.hiddenr { display: block; color: var(--muted); font-size: 13px; font-style: italic; }
  @media (prefers-reduced-motion: reduce) { .chev { transition: none; } }
  .me { background: color-mix(in srgb, var(--accent) 12%, transparent); }
</style>
