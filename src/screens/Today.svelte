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
  const done = $derived(games.filter((g) => mine[g.id]));
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
  <h1>{!games.length ? `Hola, ${profile.username}` : pending.length ? `Te ${pending.length === 1 ? 'queda 1 juego' : `quedan ${pending.length} juegos`}` : 'Todo hecho por hoy'}</h1>
  <p class="muted" style="margin:4px 0 0">{done.length} de {games.length} hechos</p>

  <div class="segs" aria-hidden="true">
    {#each games as g (g.id)}<span class="seg" class:on={mine[g.id]} style={catStyle(g.category)}></span>{/each}
  </div>

  <div class="stats3">
    <div class="stat"><span class="k">Racha</span><span class="v">{myStreak} <small>{myStreak === 1 ? 'día' : 'días'}</small></span></div>
    <div class="stat"><span class="k">Hechos hoy</span><span class="v">{done.length}<small>/{games.length}</small></span></div>
    <div class="stat"><span class="k">Ganas hoy</span><span class="v">{winsToday}</span></div>
  </div>

  {#if error}<p class="error">{error}</p>{/if}
  {#if loaded && !games.length && !error}<p class="lead">Aún no hay juegos. Un admin puede añadirlos en Ajustes.</p>{/if}

  {#if !loaded}
    <h2>Pendientes</h2>
    <div class="grid" aria-busy="true" aria-label="Cargando juegos">
      {#each [1, 2, 3, 4] as i (i)}<div class="skeleton" style="height:168px"></div>{/each}
    </div>
  {/if}

  {#if pending.length}
    <h2>Pendientes</h2>
    <div class="grid">
      {#each pending as g (g.id)}
        <div class="card" style={catStyle(g.category)}>
          <button class="cmain" onclick={() => play(g)} aria-label="Jugar a {g.name}">
            <span class="band"><GameArt game={g} height={72} /><span class="badge" aria-hidden="true">{g.emoji}</span></span>
            <span class="cbody">
              <span class="cname">{g.name}</span>
              <span class="catchip">{g.category}</span>
            </span>
          </button>
          <button class="cinfo" onclick={() => (viewing = g)} aria-label="Ver {g.name}: apuntar resultado y estadísticas">Apuntar</button>
        </div>
      {/each}
    </div>
  {/if}

  {#if done.length}
    <h2>Hechos hoy</h2>
    <div class="donelist">
      {#each done as g (g.id)}
        <button class="drow" onclick={() => (viewing = g)} style={catStyle(g.category)}>
          <span class="dart"><GameArt game={g} height={44} rounded /><span class="demoji" aria-hidden="true">{g.emoji}</span></span>
          <span class="grow">
            <span class="name">{g.name}</span>
            <span class="small muted">{myPos[g.id]?.pos ? `${myPos[g.id].pos}º de ${myPos[g.id].of}` : 'Sin puesto'}{myPos[g.id]?.pos === 1 ? ' · ganas hoy' : ''}</span>
          </span>
          <span class="num dres">{mine[g.id].display}</span>
        </button>
      {/each}
    </div>
  {/if}
</main>

{#if viewing}<GameScreen game={viewing} me={profile.id} mine={mine[viewing.id]} onBack={() => (viewing = null)} onPlay={() => play(viewing)} onRecord={() => record(viewing)} />{/if}
{#if playing}<Player game={playing} onExit={() => (playing = null)} onRecord={() => record(playing)} />{/if}
{#if recording}<ResultSheet game={recording} hue={0} openedAt={getPlaying()?.gameId === recording.id ? new Date(getPlaying().t).toISOString() : null} onClose={() => (recording = null)} onSaved={saved} />{/if}

<style>
  .top { display: flex; justify-content: space-between; align-items: center; }
  .date { font-size: 14px; font-weight: 600; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--ink); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .segs { display: flex; gap: 3px; margin: 14px 0; }
  .seg { flex: 1; height: 8px; border-radius: 4px; background: var(--line); transition: background .3s; }
  .seg.on { background: var(--c-fill); }
  .stats3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .card { position: relative; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); transition: transform .12s ease; }
  .card:active { transform: scale(.98); }
  .cmain { width: 100%; display: flex; flex-direction: column; padding: 0; border: 0; background: none; text-align: left; color: inherit; cursor: pointer; }
  .band { position: relative; display: block; }
  .badge { position: absolute; left: 12px; bottom: -22px; width: 44px; height: 44px; border-radius: 14px; background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 2px 6px rgba(11,11,11,.18); }
  .cbody { padding: 28px 12px 52px; display: flex; flex-direction: column; gap: 6px; }
  .cname { font-family: var(--display); font-size: 17px; font-weight: 750; line-height: 1.15; }
  .cinfo { position: absolute; right: 10px; bottom: 10px; height: 32px; padding: 0 12px; border-radius: 16px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); font-size: 13px; font-weight: 650; cursor: pointer; }
  .cinfo::before { content: ''; position: absolute; inset: -6px; }
  .donelist { display: flex; flex-direction: column; gap: 8px; }
  .drow { display: flex; align-items: center; gap: 12px; min-height: 62px; padding: 8px 12px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; text-align: left; color: inherit; cursor: pointer; }
  .dart { position: relative; width: 44px; flex: none; }
  .demoji { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; text-shadow: 0 1px 4px rgba(0,0,0,.4); }
  .drow .grow { flex: 1; min-width: 0; }
  .drow .name { font-weight: 650; }
  .drow .small { display: block; }
  .dres { font-size: 20px; }
  @media (prefers-reduced-motion: reduce) { .seg, .card { transition: none; } }
</style>
