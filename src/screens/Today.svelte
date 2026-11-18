<script>
  import { onMount } from 'svelte';
  import { loadGames, hueOf } from '../lib/games.js';
  import { longDate } from '../lib/day.js';
  import { humanError } from '../lib/account.js';

  let { profile } = $props();
  let games = $state([]);
  let error = $state('');
  let loaded = $state(false);

  onMount(async () => {
    try { games = await loadGames(); } catch (e) { error = humanError(e); }
    loaded = true;
  });
</script>

<main class="page fade-in">
  <div class="muted">{longDate()}</div>
  <h1>Hola, {profile.username}</h1>
  <p class="muted" style="margin:6px 0 0">{games.length} juegos hoy</p>

  <div class="segs" aria-hidden="true">
    {#each games as g, i (g.id)}<span class="seg" style="--h:{hueOf(g, i)}"></span>{/each}
  </div>

  {#if error}<p class="error">{error}</p>{/if}
  {#if loaded && !games.length && !error}<p class="lead">Aún no hay juegos. Un admin puede añadirlos.</p>{/if}

  <div class="grid">
    {#each games as g, i (g.id)}
      <a class="card" style="--h:{hueOf(g, i)}" href={g.url} target="_blank" rel="noopener">
        <span class="cem" aria-hidden="true">{g.emoji}</span>
        <span class="cname">{g.name}</span>
        <span class="ccat">{g.category}</span>
        <span class="cstate">Jugar</span>
      </a>
    {/each}
  </div>
</main>

<style>
  .segs { display: flex; gap: 3px; margin: 16px 0 20px; }
  .seg { flex: 1; height: 8px; border-radius: 4px; background: hsl(var(--h) var(--cs) var(--bl)); }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .card {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-height: 140px;
    padding: 14px; border-radius: 18px; text-decoration: none; color: var(--ink);
    background: hsl(var(--h) var(--cs) var(--cl)); border: 2px solid hsl(var(--h) calc(var(--cs) - 15%) var(--bl));
    transition: transform .12s ease;
  }
  .card:active { transform: scale(.98); }
  .cem { font-size: 32px; line-height: 1; }
  .cname { font-weight: 700; font-size: 17px; line-height: 1.2; margin-top: 8px; }
  .ccat { font-size: 13px; color: var(--muted); }
  .cstate { margin-top: auto; display: inline-flex; align-items: center; height: 34px; padding: 0 16px; border-radius: 999px; background: var(--ink); color: var(--bg); font-weight: 650; font-size: 14px; }
  @media (prefers-reduced-motion: reduce) { .card { transition: none; } }
</style>
