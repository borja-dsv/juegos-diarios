<script>
  import { onMount } from 'svelte';
  import { loadGames } from '../lib/games.js';
  import { loadMyToday, loadMyDays, loadTodayVisible, rank, markPlaying, getPlaying, clearPlaying } from '../lib/results.js';
  import { streak } from '../lib/standings.js';
  import { madridToday, longDate } from '../lib/day.js';
  import { catStyle } from '../lib/categories.js';
  import { humanError } from '../lib/account.js';
  import GameArt from './GameArt.svelte';
  import Player from './Player.svelte';
  import ResultSheet from './ResultSheet.svelte';
  import GameScreen from './GameScreen.svelte';

  let { profile } = $props();
  let games = $state([]);
  let mine = $state({});            // mis resultados de hoy por juego
  let todayRows = $state([]);       // resultados de hoy que puedo ver
  let days = $state([]);            // días en los que he jugado
  let error = $state('');
  let loaded = $state(false);
  let playing = $state(null);       // juego abierto a pantalla completa
  let recording = $state(null);     // juego cuyo resultado apunto
  let viewing = $state(null);       // pantalla de un juego

  const pending = $derived(games.filter((g) => !mine[g.id]));
  // Pendientes agrupados por nivel (T1, T2…), en el orden que ha decidido el admin.
  const pendingTiers = $derived([...new Set(pending.map((g) => g.tier ?? 2))].sort().map((t) => ({ tier: t, games: pending.filter((g) => (g.tier ?? 2) === t) })));
  const done = $derived(games.filter((g) => mine[g.id]));
  // Progreso por nivel: un tramo por cada nivel (T1, T2…), proporcional a su número de juegos.
  const tiers = $derived([...new Set(games.map((g) => g.tier ?? 2))].sort().map((t) => {
    const list = games.filter((g) => (g.tier ?? 2) === t);
    return { tier: t, total: list.length, done: list.filter((g) => mine[g.id]).length };
  }));
  const myStreak = $derived(streak(days, madridToday()));
  // Mi puesto de hoy en cada juego que he jugado.
  const myPos = $derived.by(() => {
    const out = {};
    for (const g of done) {
      const ranked = rank(todayRows.filter((r) => r.game_id === g.id), g.better);
      const me = ranked.find((r) => r.user_id === profile.id);
      out[g.id] = { pos: me?.pos, of: ranked.length };
    }
    return out;
  });
  const winsToday = $derived(Object.values(myPos).filter((p) => p.pos === 1).length);

  async function load() {
    try {
      [games, mine, todayRows, days] = await Promise.all([loadGames(), loadMyToday(profile.id), loadTodayVisible(), loadMyDays(profile.id)]);
    } catch (e) { error = humanError(e); }
    loaded = true;
  }

  function play(g) { markPlaying(g.id); viewing = null; playing = g; }
  // Si apuntas desde la pantalla de un juego, al cerrar vuelves a ella.
  function record(g) { playing = null; recording = g; }
  async function saved(row) {
    mine = { ...mine, [row.game_id]: row };
    clearPlaying();
    const g = recording;
    recording = null;
    await load();              // ahora puedo ver el ranking de hoy de ese juego
    viewing = g;
  }

  // Al volver de un juego abierto fuera de la app, pide el resultado.
  function onVisible() {
    if (document.hidden || recording) return;
    const p = getPlaying();
    const g = p && games.find((x) => x.id === p.gameId);
    if (g && !mine[g.id] && g.open_mode === 'external' && Date.now() - p.t > 3000) record(g);
  }

  onMount(() => {
    load();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });
</script>

<main class="page fade-in">
  <div class="top">
    <span class="muted date">{longDate()}</span>
    <span class="avatar" aria-label="Tu perfil: {profile.username}">{profile.username.charAt(0).toUpperCase()}</span>
  </div>
  <h1 class="hello">{!games.length ? `Hola, ${profile.username}` : pending.length ? `Te ${pending.length === 1 ? 'queda 1 juego' : `quedan ${pending.length} juegos`}` : 'Todo hecho por hoy'}</h1>

  <div class="bars" role="img" aria-label={tiers.map((t) => `T${t.tier}: ${t.done} de ${t.total}`).join(', ')}>
    {#each tiers as t (t.tier)}
      <div class="tramo" style="flex:{t.total}">
        <div class="track"><span class="fill t{t.tier}" style="width:{t.total ? (t.done / t.total) * 100 : 0}%"></span></div>
        <span class="tlabel"><b>T{t.tier}</b> · {t.done}/{t.total}</span>
      </div>
    {/each}
  </div>
  <p class="meta">
    <span><b>{done.length}</b> de {games.length} hechos</span>
    <span aria-hidden="true">·</span>
    <span>Racha <b>{myStreak}</b> {myStreak === 1 ? 'día' : 'días'}</span>
    {#if winsToday}<span aria-hidden="true">·</span><span>Ganas <b>{winsToday}</b></span>{/if}
  </p>

  {#if error}<p class="error">{error}</p>{/if}
  {#if loaded && !games.length && !error}<p class="lead">Aún no hay juegos. Un admin puede añadirlos en Ajustes.</p>{/if}

  {#if !loaded}
    <div class="list" aria-busy="true" aria-label="Cargando juegos">
      {#each [1, 2, 3, 4, 5] as i (i)}<div class="row"><span class="skeleton thumbsk"></span><span class="grow"><span class="skeleton linesk"></span></span></div>{/each}
    </div>
  {/if}

  {#each pendingTiers as grp (grp.tier)}
    <h2 class="section"><span>{grp.tier === 1 ? 'Imprescindibles' : 'El resto'}</span><span class="tier">T{grp.tier} · {grp.games.length}</span></h2>
    <ul class="list">
      {#each grp.games as g (g.id)}
        <li class="row" style={catStyle(g.category)}>
          <button class="main" onclick={() => play(g)} aria-label="Jugar a {g.name}">
            <span class="thumb"><GameArt game={g} height={48} rounded /></span>
            <span class="grow">
              <span class="name">{g.name}</span>
              <span class="sub"><span class="dot"></span>{g.category}</span>
            </span>
            <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
          </button>
          <button class="note" onclick={() => (viewing = g)} aria-label="Apuntar resultado de {g.name}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
          </button>
        </li>
      {/each}
    </ul>
  {/each}

  {#if done.length}
    <h2 class="section"><span>Hechos hoy</span><span class="tier">{done.length}</span></h2>
    <ul class="list">
      {#each done as g (g.id)}
        <li class="row" style={catStyle(g.category)}>
          <button class="main" onclick={() => (viewing = g)} aria-label="{g.name}: {mine[g.id].display}. Ver ranking de hoy">
            <span class="thumb"><GameArt game={g} height={48} rounded /></span>
            <span class="grow">
              <span class="name">{g.name}</span>
              <span class="sub">{myPos[g.id]?.pos ? `${myPos[g.id].pos}º de ${myPos[g.id].of}` : 'Apuntado'}{myPos[g.id]?.pos === 1 ? ' · vas ganando' : ''}</span>
            </span>
            <span class="res">{mine[g.id].display}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</main>

{#if viewing}<GameScreen game={viewing} me={profile.id} isAdmin={profile.is_admin} mine={mine[viewing.id]} onBack={() => (viewing = null)} onPlay={() => play(viewing)} onRecord={() => record(viewing)} />{/if}
{#if playing}<Player game={playing} onExit={() => (playing = null)} onRecord={() => record(playing)} />{/if}
{#if recording}<ResultSheet game={recording} hue={0} openedAt={getPlaying()?.gameId === recording.id ? new Date(getPlaying().t).toISOString() : null} onClose={() => (recording = null)} onSaved={saved} />{/if}

<style>
  .top { display: flex; justify-content: space-between; align-items: center; }
  .date { font-size: 14px; font-weight: 500; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--surface-2); color: var(--ink); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
  .hello { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; margin: 10px 0 16px; }
  .bars { display: flex; gap: 0; margin-top: 2px; }
  .tramo { position: relative; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding-right: 9px; }
  .tramo + .tramo { padding-left: 2px; }
  /* línea vertical al final de cada tramo: marca dónde acaba cada nivel */
  .tramo::after { content: ''; position: absolute; right: 3px; top: -5px; width: 2px; height: 16px; border-radius: 1px; background: var(--muted); opacity: .5; }
  .track { height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
  .tlabel { font-size: 12px; color: var(--muted); white-space: nowrap; }
  .tlabel b { color: var(--ink); font-weight: 650; }
  .fill { display: block; height: 100%; border-radius: 3px; background: var(--accent); transition: width .5s ease; }
  .fill.t2, .fill.t3 { background: color-mix(in srgb, var(--accent) 50%, var(--surface-2)); }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 8px; font-size: 14px; color: var(--muted); }
  .meta b { color: var(--ink); font-weight: 650; }
  .section { display: flex; justify-content: space-between; align-items: baseline; margin: 28px 4px 10px; font-family: Inter, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
  .tier { font-weight: 500; letter-spacing: 0; text-transform: none; }
  .list { list-style: none; margin: 0; padding: 0; background: var(--surface); border-radius: 20px; overflow: hidden; }
  .row { position: relative; display: flex; align-items: center; padding: 0; gap: 0; border-top: 0; }
  .row + .row::before { content: ''; position: absolute; top: 0; left: 76px; right: 16px; height: 1px; background: var(--line); }
  .main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 14px; padding: 12px 8px 12px 14px; background: none; border: 0; text-align: left; color: inherit; cursor: pointer; transition: background .15s ease; }
  .main:active { background: var(--surface-2); }
  .thumb { width: 48px; flex: none; }
  .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .name { font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c-fill); flex: none; }
  .chev { color: var(--muted); opacity: .6; flex: none; }
  .note { width: 44px; height: 44px; margin-right: 8px; flex: none; border: 0; border-radius: 12px; background: transparent; color: var(--muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .note:active { background: var(--surface-2); }
  .res { font-family: var(--display); font-size: 17px; font-weight: 700; padding-right: 8px; white-space: nowrap; }
  .thumbsk { display: block; width: 48px; height: 48px; border-radius: 12px; margin: 12px 0 12px 14px; }
  .linesk { display: block; height: 14px; width: 60%; border-radius: 7px; }
  @media (prefers-reduced-motion: reduce) { .fill, .main { transition: none; } }
</style>
