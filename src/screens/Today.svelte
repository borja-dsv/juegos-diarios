<script>
  import { onMount } from 'svelte';
  import { loadGames } from '../lib/games.js';
  import { loadMyToday, loadMyDays, loadTodayVisible, rank, markPlaying, getPlaying, clearPlaying } from '../lib/results.js';
  import { streak } from '../lib/standings.js';
  import { madridToday, longDate } from '../lib/day.js';
  import { catStyle } from '../lib/categories.js';
  import { famStyleFor } from '../lib/palette.js';
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
        <span class="tname t{t.tier}">T{t.tier}</span>
        <div class="track"><span class="fill t{t.tier}" style="width:{t.total ? (t.done / t.total) * 100 : 0}%"></span></div>
        <span class="nums" aria-hidden="true">
          {#if t.done > 0 && t.done < t.total}<span class="now" style="left:{(t.done / t.total) * 100}%">{t.done}</span>{/if}
          <span class="lim" class:hit={t.done === t.total}>{t.total}</span>
        </span>
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
        <li class="row fam" style="{catStyle(g.category)};{famStyleFor(g.id)}">
          <button class="main" onclick={() => (viewing = g)} aria-label="Ver {g.name}: ranking y resultado">
            <span class="thumb"><GameArt game={g} height={48} rounded /></span>
            <span class="grow">
              <span class="name">{g.name}</span>
              <span class="sub"><span class="dot"></span>{g.category}</span>
            </span>
          </button>
          <button class="play" onclick={() => play(g)} aria-label="Jugar a {g.name}">
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.2 21.6 7 12 11.8 2.4 7z" fill="#FFFFFF"/>
              <path d="M2.4 7 12 11.8v10L2.4 17z" fill="#E7E1D6"/>
              <path d="M21.6 7 12 11.8v10l9.6-4.8z" fill="#CFC7B8"/>
              <g fill="#23201C">
                <ellipse cx="12" cy="7" rx="1.5" ry=".9"/>
                <circle cx="4.9" cy="10.6" r="1.05"/><circle cx="7.2" cy="14.3" r="1.05"/><circle cx="9.5" cy="18" r="1.05"/>
                <circle cx="15.2" cy="12.4" r="1"/><circle cx="18.6" cy="10.7" r="1"/>
                <circle cx="15.2" cy="15.6" r="1"/><circle cx="18.6" cy="13.9" r="1"/>
                <circle cx="15.2" cy="18.8" r="1"/><circle cx="18.6" cy="17.1" r="1"/>
              </g>
            </svg>
          </button>
          <button class="podium" onclick={() => (viewing = g)} aria-label="Ranking y apuntar resultado de {g.name}"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor"/><rect x="8.5" y="9" width="7" height="13" rx="1.6" fill="currentColor"/><rect x="1.5" y="13" width="6.4" height="9" rx="1.6" fill="currentColor" opacity=".7"/><rect x="16.1" y="15.5" width="6.4" height="6.5" rx="1.6" fill="currentColor" opacity=".55"/></svg></button>
        </li>
      {/each}
    </ul>
  {/each}

  {#if done.length}
    <h2 class="section"><span>Hechos hoy</span><span class="tier">{done.length}</span></h2>
    <ul class="list">
      {#each done as g (g.id)}
        <li class="row fam" style="{catStyle(g.category)};{famStyleFor(g.id)}">
          <button class="main" onclick={() => (viewing = g)} aria-label="{g.name}: {mine[g.id].display}. Ver ranking de hoy">
            <span class="thumb"><GameArt game={g} height={48} rounded /></span>
            <span class="grow">
              <span class="name">{g.name}</span>
              <span class="sub"><span class="dot"></span>{g.category}</span>
            </span>
            <span class="right">
              <span class="res">{mine[g.id].display}</span>
              {#if myPos[g.id]?.pos}
                <span class="posline">
                  <span class="pos" class:first={myPos[g.id].pos === 1} aria-label="Puesto {myPos[g.id].pos} de {myPos[g.id].of}"><b>{myPos[g.id].pos}º</b>/{myPos[g.id].of}</span>
                  {#if myPos[g.id].pos <= 3}
                    <svg class="medal-ico m{myPos[g.id].pos}" width="16" height="20" viewBox="0 0 20 24" aria-hidden="true">
                      <path d="M5 1h4l2.5 7h-4z" fill="#C0392B"/><path d="M15 1h-4L8.5 8h4z" fill="#2E5A88"/>
                      <circle cx="10" cy="15" r="7.5" class="disc"/><circle cx="10" cy="15" r="5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>
                      <text x="10" y="18.2" text-anchor="middle" font-size="8.5" font-weight="800" fill="rgba(0,0,0,.55)">{myPos[g.id].pos}</text>
                    </svg>
                  {/if}
                </span>
              {/if}
            </span>
          </button>
          <button class="podium" onclick={() => (viewing = g)} aria-label="Ranking de hoy de {g.name}"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor"/><rect x="8.5" y="9" width="7" height="13" rx="1.6" fill="currentColor"/><rect x="1.5" y="13" width="6.4" height="9" rx="1.6" fill="currentColor" opacity=".7"/><rect x="16.1" y="15.5" width="6.4" height="6.5" rx="1.6" fill="currentColor" opacity=".55"/></svg></button>
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
  .tramo { position: relative; min-width: 0; display: flex; flex-direction: column; gap: 5px; padding-right: 9px; }
  .tramo + .tramo { padding-left: 2px; }
  /* línea vertical al final de cada tramo: marca dónde acaba cada nivel */
  .tname { align-self: center; font-size: 11px; font-weight: 800; letter-spacing: .06em; }
  .tname.t1 { color: var(--t1); } .tname.t2, .tname.t3 { color: var(--t2); }
  .tramo::after { content: ''; position: absolute; right: 3px; top: 18px; width: 2px; height: 16px; border-radius: 1px; background: var(--muted); opacity: .5; }
  .track { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
  .nums { position: relative; display: block; height: 16px; font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
  .now { position: absolute; top: 0; transform: translateX(-50%); color: var(--ink); }
  .lim { position: absolute; top: 0; right: -6px; transform: translateX(50%); color: var(--muted); }
  .lim.hit { color: var(--ink); }
  .fill { display: block; height: 100%; border-radius: 3px; background: var(--accent); transition: width .5s ease; }
  .fill.t1 { background: var(--t1); } .fill.t2, .fill.t3 { background: var(--t2); }
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
  .play { flex: none; width: 40px; height: 40px; border: 0; border-radius: 12px; background: var(--f-btn-bg); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px color-mix(in srgb, var(--f-btn-bg) 35%, transparent); transition: transform .12s ease; }
  .play svg { filter: drop-shadow(0 1px 1px rgba(0,0,0,.25)); }
  .play:active { transform: scale(.95); }
  .podium { flex: none; width: 40px; height: 40px; margin: 0 10px 0 8px; border: 0; border-radius: 12px; background: var(--f-soft-bg); color: var(--f-soft-fg); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .12s ease; }
  .podium:active { transform: scale(.92); }
  .pos { flex: none; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .medal-ico { flex: none; filter: drop-shadow(0 1px 1px rgba(0,0,0,.2)); }
  .medal-ico.m1 .disc { fill: #E9B93A; } .medal-ico.m2 .disc { fill: #C3C7CE; } .medal-ico.m3 .disc { fill: #C98A55; }
  .pos b { font-family: var(--display); font-size: 17px; font-weight: 800; color: var(--ink); }
  .right { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 1px; padding-right: 2px; }
  .posline { display: flex; align-items: center; gap: 4px; }
  .pos.first b { color: var(--f-soft-fg); }
  .res { font-family: var(--display); font-size: 17px; font-weight: 700; padding-right: 8px; white-space: nowrap; }
  .thumbsk { display: block; width: 48px; height: 48px; border-radius: 12px; margin: 12px 0 12px 14px; }
  .linesk { display: block; height: 14px; width: 60%; border-radius: 7px; }
  @media (prefers-reduced-motion: reduce) { .fill, .main, .play, .podium { transition: none; } }
</style>
