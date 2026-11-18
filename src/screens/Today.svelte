<script>
  import { onMount } from 'svelte';
  import { loadGames, hueOf } from '../lib/games.js';
  import { loadMyToday, markPlaying, getPlaying, clearPlaying } from '../lib/results.js';
  import { longDate } from '../lib/day.js';
  import { humanError } from '../lib/account.js';
  import Player from './Player.svelte';
  import ResultSheet from './ResultSheet.svelte';
  import DaySheet from './DaySheet.svelte';

  let { profile } = $props();
  let games = $state([]);
  let mine = $state({});            // mis resultados de hoy por juego
  let error = $state('');
  let loaded = $state(false);
  let playing = $state(null);       // juego abierto en pantalla completa
  let recording = $state(null);     // juego cuyo resultado estoy apuntando
  let viewing = $state(null);       // juego cuyo ranking de hoy estoy viendo

  const hues = $derived(Object.fromEntries(games.map((g, i) => [g.id, hueOf(g, i)])));
  const pending = $derived(games.filter((g) => !mine[g.id]));
  const done = $derived(games.filter((g) => mine[g.id]));

  async function load() {
    try {
      [games, mine] = await Promise.all([loadGames(), loadMyToday(profile.id)]);
    } catch (e) { error = humanError(e); }
    loaded = true;
  }

  function open(g) {
    if (mine[g.id]) { viewing = g; return; }
    markPlaying(g.id);
    playing = g;
  }
  function record(g) { playing = null; recording = g; }
  function saved(row) {
    mine = { ...mine, [row.game_id]: row };
    clearPlaying();
    const g = recording;
    recording = null;
    viewing = g;              // al apuntar, se desbloquea el ranking de hoy
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
  <div class="muted">{longDate()}</div>
  <h1>{!games.length ? `Hola, ${profile.username}` : pending.length ? `Te ${pending.length === 1 ? 'queda 1 juego' : `quedan ${pending.length} juegos`}` : 'Todo hecho por hoy 🎉'}</h1>
  <p class="muted" style="margin:6px 0 0">{done.length} de {games.length} hechos</p>

  <div class="segs" aria-hidden="true">
    {#each games as g (g.id)}<span class="seg" class:on={mine[g.id]} style="--h:{hues[g.id]}"></span>{/each}
  </div>

  {#if error}<p class="error">{error}</p>{/if}
  {#if loaded && !games.length && !error}<p class="lead">Aún no hay juegos. Un admin puede añadirlos en Ajustes.</p>{/if}

  {#if pending.length}
    <div class="grid">
      {#each pending as g (g.id)}
        <div class="card" style="--h:{hues[g.id]}">
          <button class="cmain" onclick={() => open(g)}>
            <span class="cem" aria-hidden="true">{g.emoji}</span>
            <span class="cname">{g.name}</span>
            <span class="ccat">{g.category}</span>
            <span class="cstate">Jugar</span>
          </button>
          <button class="cadd" onclick={() => record(g)} aria-label="Apuntar resultado de {g.name}">+</button>
        </div>
      {/each}
    </div>
  {/if}

  {#if done.length}
    <h2>Hechos hoy</h2>
    <div class="grid">
      {#each done as g (g.id)}
        <button class="card done" style="--h:{hues[g.id]}" onclick={() => open(g)} aria-label="{g.name}: {mine[g.id].display}. Ver ranking de hoy">
          <span class="cem" aria-hidden="true">{g.emoji}</span>
          <span class="cname">{g.name}</span>
          <span class="cres">{mine[g.id].display}</span>
          <span class="ccat">Ver ranking →</span>
        </button>
      {/each}
    </div>
  {/if}
</main>

{#if playing}<Player game={playing} onExit={() => (playing = null)} onRecord={() => record(playing)} />{/if}
{#if recording}<ResultSheet game={recording} hue={hues[recording.id]} openedAt={getPlaying()?.gameId === recording.id ? new Date(getPlaying().t).toISOString() : null} onClose={() => (recording = null)} onSaved={saved} />{/if}
{#if viewing}<DaySheet game={viewing} hue={hues[viewing.id]} me={profile.id} onClose={() => (viewing = null)} />{/if}

<style>
  .segs { display: flex; gap: 3px; margin: 16px 0 20px; }
  .seg { flex: 1; height: 8px; border-radius: 4px; background: var(--line); transition: background .3s; }
  .seg.on { background: hsl(var(--h) 65% 46%); }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .card {
    position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-height: 140px;
    border-radius: 18px; color: var(--ink); text-align: left; padding: 0; font: inherit; cursor: pointer;
    background: hsl(var(--h) var(--cs) var(--cl)); border: 2px solid hsl(var(--h) calc(var(--cs) - 15%) var(--bl));
  }
  .card.done { padding: 14px; background: hsl(var(--h) 60% 30%); border-color: hsl(var(--h) 60% 30%); color: #fff; }
  .card.done .ccat { color: rgba(255,255,255,.85); margin-top: 2px; }
  .cmain { flex: 1; width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 14px; background: none; border: 0; text-align: left; cursor: pointer; color: inherit; }
  .cem { font-size: 32px; line-height: 1; }
  .cname { font-weight: 700; font-size: 17px; line-height: 1.2; margin-top: 8px; }
  .ccat { font-size: 13px; color: var(--muted); }
  .cres { margin-top: auto; font-size: 28px; font-weight: 720; line-height: 1.05; }
  .cstate { margin-top: auto; display: inline-flex; align-items: center; height: 34px; padding: 0 16px; border-radius: 999px; background: var(--ink); color: var(--bg); font-weight: 650; font-size: 14px; }
  .cadd { position: absolute; top: 8px; right: 8px; width: 40px; height: 40px; border-radius: 50%; border: 0; background: hsl(var(--h) var(--cs) var(--bl)); font-size: 22px; font-weight: 600; cursor: pointer; color: inherit; }
  @media (prefers-reduced-motion: reduce) { .seg { transition: none; } }
</style>
