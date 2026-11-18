<script>
  // Cabecera ilustrada de un juego: su imagen oficial de vista previa si la tiene;
  // si no (o si no carga), un dibujo propio o la textura de su categoría.
  import { catStyle } from '../lib/categories.js';
  let { game, height = 64, rounded = false } = $props();
  let broken = $state(false);
  const WORD = [['J', '#6AAA64'], ['U', '#C9B458'], ['E', '#787C7E'], ['G', '#6AAA64'], ['O', '#6AAA64']];
</script>

<div class="art" class:rounded style="height:{height}px;{catStyle(game.category)}" aria-hidden="true">
  {#if game.image_url && !broken}
    <img src={game.image_url} alt="" loading="lazy" referrerpolicy="no-referrer" onerror={() => (broken = true)} />
  {:else if game.id === 'wordle-es'}
    <div class="word">{#each WORD as [l, c]}<span style="background:{c}">{l}</span>{/each}</div>
  {:else if game.id === 'poople'}
    <div class="poople"></div>
  {:else if game.id === 'maptap'}
    <svg class="pin" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" fill="#fff"/><circle cx="12" cy="10" r="2.6" fill="var(--c-fill)"/></svg>
  {/if}
</div>

<style>
  .art { position: relative; overflow: hidden; background: var(--c-pat), var(--c-fill); flex: none; }
  .rounded { border-radius: 12px; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .word { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 4px; background: #121213; }
  .word span { width: 22%; max-width: 30px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: clamp(10px, 40%, 18px); border-radius: 3px; }
  .poople { position: absolute; inset: 0; background: conic-gradient(#7B4B2A 25%, #F3EDE4 0 50%, #7B4B2A 0 75%, #F3EDE4 0) 0 0 / 22px 22px; }
  .pin { position: absolute; right: 14%; top: 50%; transform: translateY(-50%); height: 70%; filter: drop-shadow(0 2px 3px rgba(0,0,0,.25)); }
</style>
