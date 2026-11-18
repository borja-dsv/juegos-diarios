<script>
  // Admins: corregir o anular el resultado de un jugador. Queda marcado y anunciado en el chat del juego.
  import { correctResult, voidResult } from '../lib/results.js';
  import { humanError } from '../lib/account.js';
  import { catStyle } from '../lib/categories.js';

  let { game, row, onClose, onDone } = $props();
  const scaled = Number(game.max_value) >= 2 && Number(game.max_value) <= 12;
  const min = Number(game.min_value ?? 1);
  const keys = scaled ? Array.from({ length: Number(game.max_value) - min + 1 }, (_, i) => i + min) : [];
  let typed = $state('');
  let busy = $state(false);
  let error = $state('');
  let confirmVoid = $state(false);

  async function run(fn) {
    busy = true; error = '';
    try { await fn(); onDone(); } catch (e) { error = humanError(e); } finally { busy = false; }
  }
  const pick = (n) => run(() => correctResult(row.id, { value: n, failed: false, display: `${n}/${game.max_value}` }));
  const fail = () => run(() => correctResult(row.id, { value: null, failed: true, display: `X/${game.max_value ?? ''}`.replace(/\/$/, '') }));
  function saveTyped() {
    const v = Number(typed.replace(/\./g, '').replace(',', '.'));
    if (!typed.trim() || Number.isNaN(v)) { error = 'Escribe un número.'; return; }
    run(() => correctResult(row.id, { value: v, failed: false, display: typed.trim() }));
  }
  function remove() {
    if (!confirmVoid) { confirmVoid = true; return; }
    run(() => voidResult(row.id));
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<div class="sheet" role="presentation" onclick={(e) => e.target === e.currentTarget && onClose()}>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="cs-title" style={catStyle(game.category)}>
    <button class="closex" onclick={onClose} aria-label="Cerrar">✕</button>
    <h2 id="cs-title">Corregir a {row.profiles?.username}</h2>
    <p class="muted small">{game.emoji} {game.name} · ahora tiene <b>{row.display}</b>. El cambio quedará marcado como «corregido» y se avisará en el chat del juego.</p>

    {#if scaled}
      <div class="keys" role="group" aria-label="Resultado correcto">
        {#each keys as n}<button class="key" disabled={busy} onclick={() => pick(n)}>{n}</button>{/each}
        <button class="key miss" disabled={busy} onclick={fail} aria-label="No lo sacó">✕</button>
      </div>
    {:else}
      <form class="typed" onsubmit={(e) => { e.preventDefault(); saveTyped(); }}>
        <input bind:value={typed} inputmode="decimal" placeholder="Resultado correcto" aria-label="Resultado correcto" />
        <button class="btn go" disabled={busy || !typed.trim()}>Guardar</button>
      </form>
    {/if}

    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="actions">
      <button class="btn danger" disabled={busy} onclick={remove}>{confirmVoid ? 'Pulsa otra vez para anularlo' : 'Anular resultado'}</button>
    </div>
  </div>
</div>

<style>
  .keys { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 8px; }
  .key { width: 52px; height: 52px; border-radius: 50%; border: 2px solid var(--line); background: var(--bg); font-size: 20px; font-weight: 700; cursor: pointer; }
  .key.miss { color: var(--danger); }
  .typed { display: flex; gap: 8px; margin: 14px 0 8px; }
  .typed input { flex: 1; min-width: 0; height: 52px; padding: 0 14px; border: 2px solid var(--accent); border-radius: 12px; background: var(--surface); font-size: 20px; font-weight: 700; text-align: center; }
</style>
