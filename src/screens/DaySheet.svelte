<script>
  import { onMount } from 'svelte';
  import { loadGameDay, rank } from '../lib/results.js';
  import { humanError } from '../lib/account.js';

  let { game, hue, me, onClose } = $props();
  let rows = $state([]);
  let error = $state('');
  let loaded = $state(false);

  onMount(async () => {
    try { rows = rank(await loadGameDay(game.id), game.better); } catch (e) { error = humanError(e); }
    loaded = true;
  });
  const medal = (p) => ({ 1: '🥇', 2: '🥈', 3: '🥉' })[p] || (p ? p + 'º' : '—');
</script>

<div class="sheet" role="presentation" onclick={(e) => e.target === e.currentTarget && onClose()}>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="ds-title" style="--h:{hue}">
    <button class="closex" onclick={onClose} aria-label="Cerrar">✕</button>
    <h2 id="ds-title"><span aria-hidden="true">{game.emoji}</span> {game.name} · hoy</h2>
    <p class="muted small">{game.better === 'low' ? 'Gana el número más bajo.' : 'Gana el número más alto.'} Los empates comparten puesto.</p>
    {#if error}<p class="error">{error}</p>{/if}
    {#if loaded}
      <ul class="group" style="margin-top:12px">
        {#each rows as r (r.id)}
          <li class="row" class:me={r.user_id === me}>
            <span class="pos" aria-label={r.pos ? `Puesto ${r.pos}` : 'Sin puesto'}>{medal(r.pos)}</span>
            <span class="grow name">{r.profiles?.username}{r.user_id === me ? ' (tú)' : ''}</span>
            {#if r.source === 'share'}<span class="tag" title="Leído del texto de Compartir">✓ verificado</span>{/if}
            <b>{r.display}</b>
          </li>
        {/each}
      </ul>
      {#if rows.length === 1}<p class="small muted">De momento solo estás tú. Cuando jueguen los demás, aparecerán aquí.</p>{/if}
    {/if}
  </div>
</div>

<style>
  .pos { width: 32px; text-align: center; font-weight: 700; }
  .me { background: color-mix(in srgb, var(--done) 10%, transparent); }
  .tag { font-size: 12px; color: var(--done); font-weight: 650; white-space: nowrap; }
</style>
