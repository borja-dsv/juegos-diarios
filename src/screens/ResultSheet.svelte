<script>
  import { parseShare } from '../lib/parse.js';
  import { saveResult } from '../lib/results.js';
  import { humanError } from '../lib/account.js';
  import { catStyle } from '../lib/categories.js';

  let { game, hue = 0, openedAt = null, onClose, onSaved } = $props();

  const scaled = $derived(game.max_value >= 2 && game.max_value <= 12);
  let typed = $state('');
  let pasted = $state('');
  let busy = $state(false);
  let error = $state('');
  let info = $state('');

  async function save(r) {
    busy = true; error = '';
    try {
      const row = await saveResult({ game_id: game.id, opened_at: openedAt, raw: null, ...r });
      onSaved(row);
    } catch (e) {
      error = /duplicate|unique/i.test(e.message) ? 'Ya tienes un resultado de hoy en este juego.' : humanError(e);
    } finally { busy = false; }
  }

  const pick = (n) => save({ value: n, failed: false, display: `${n}/${game.max_value}`, source: 'manual' });
  const fail = () => save({ value: null, failed: true, display: `X/${game.max_value ?? ''}`.replace(/\/$/, ''), source: 'manual' });
  const justDone = () => save({ value: null, failed: false, display: 'Hecho', source: 'manual' });
  function saveTyped() {
    const v = Number(typed.replace(/\./g, '').replace(',', '.'));
    if (!typed.trim() || Number.isNaN(v)) { error = 'Escribe un número.'; return; }
    save({ value: v, failed: false, display: typed.trim(), source: 'manual' });
  }

  function usePasted(text) {
    const r = parseShare(text, game);
    if (!r || r.error) { error = r?.error || 'No he sabido leer ese texto. Apunta el número con los botones.'; return; }
    save({ value: r.value, failed: r.failed, display: r.display, raw: text.slice(0, 3000), source: r.verified ? 'share' : 'manual' });
  }
  async function pasteFromClipboard() {
    error = ''; info = '';
    try {
      const t = await navigator.clipboard.readText();
      if (!t.trim()) { info = 'El portapapeles está vacío. Pulsa «Compartir» en el juego y vuelve.'; return; }
      usePasted(t);
    } catch {
      info = 'Tu navegador no deja leer el portapapeles. Mantén pulsado el recuadro de abajo y elige «Pegar».';
    }
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<div class="sheet" role="presentation" onclick={(e) => e.target === e.currentTarget && onClose()}>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="rs-title" style={catStyle(game.category)}>
    <button class="closex" onclick={onClose} aria-label="Cerrar">✕</button>
    <h2 id="rs-title"><span aria-hidden="true">{game.emoji}</span> ¿Cómo te ha ido en {game.name}?</h2>
    <p class="muted small">{game.better === 'low' ? 'Gana el número más bajo.' : 'Gana el número más alto.'} Solo puedes apuntarlo una vez.</p>

    <button class="btn primary block" style="margin:12px 0" disabled={busy} onclick={pasteFromClipboard}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg>Pegar lo copiado del juego</button>
    {#if info}<p class="small muted">{info}</p>{/if}
    <label class="field"><span>…o pega aquí el texto de «Compartir»</span>
      <textarea bind:value={pasted} placeholder="Mantén pulsado y elige Pegar" onpaste={(e) => { const t = e.clipboardData?.getData('text'); if (t) { e.preventDefault(); pasted = t; usePasted(t); } }}></textarea>
    </label>

    <p class="small muted" style="margin:4px 0 8px">O apúntalo a mano:</p>
    {#if scaled}
      <div class="keys" role="group" aria-label="Resultado">
        {#each Array.from({ length: game.max_value }, (_, i) => i + 1) as n}
          <button class="key" disabled={busy} onclick={() => pick(n)}>{n}</button>
        {/each}
        <button class="key miss" disabled={busy} onclick={fail} aria-label="No lo saqué">✕</button>
      </div>
    {:else}
      <form class="typed" onsubmit={(e) => { e.preventDefault(); saveTyped(); }}>
        <input bind:value={typed} inputmode="decimal" placeholder="Tu número" aria-label="Tu resultado" />
        <button class="btn go" disabled={busy || !typed.trim()}>Guardar</button>
      </form>
    {/if}

    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="actions"><button class="btn quiet" disabled={busy} onclick={justDone}>Hecho, sin resultado</button></div>
  </div>
</div>

<style>
  .keys { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
  .key { width: 52px; height: 52px; border-radius: 50%; border: 2px solid var(--line); background: var(--bg); font-size: 20px; font-weight: 700; cursor: pointer; }
  .key:active { background: var(--done); color: var(--done-ink); border-color: var(--done); }
  .key.miss { color: var(--danger); }
  .typed { display: flex; gap: 8px; margin-bottom: 8px; }
  .typed input { flex: 1; min-width: 0; height: 52px; padding: 0 14px; border: 2px solid var(--accent); border-radius: 12px; background: var(--surface); font-size: 22px; font-weight: 700; text-align: center; }
</style>
