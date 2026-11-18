<script>
  import { onMount } from 'svelte';
  import { loadAllGames, upsertGame, deleteGame, saveOrder, slugify } from '../lib/games.js';
  import { humanError } from '../lib/account.js';
  import { CATEGORY_NAMES } from '../lib/categories.js';
  import GameArt from './GameArt.svelte';

  const CATEGORIES = CATEGORY_NAMES;
  let games = $state([]);
  let error = $state('');
  let busy = $state(false);
  let editing = $state(null);     // copia del juego que se edita (o uno nuevo)
  let confirmDel = $state(false);

  async function reload() {
    try { games = await loadAllGames(); } catch (e) { error = humanError(e); }
  }
  async function run(fn) {
    busy = true; error = '';
    try { await fn(); await reload(); } catch (e) { error = humanError(e); } finally { busy = false; }
  }

  function move(i, d) {
    const list = [...games];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    games = list;
    run(() => saveOrder(list));
  }

  function startNew() {
    editing = { id: '', name: '', url: 'https://', image_url: '', emoji: '🎯', category: 'Otros', open_mode: 'embed', better: 'low', max_value: null, active: true, sort: games.length + 1, isNew: true };
    confirmDel = false;
  }
  function startEdit(g) { editing = { ...g, max_value: g.max_value ?? null }; confirmDel = false; }

  function save() {
    const g = editing;
    if (!g.name.trim() || !/^https:\/\/\S+\.\S+/.test(g.url)) { error = 'Pon un nombre y un enlace que empiece por https://'; return; }
    const { isNew, created_at, ...row } = g;
    if (isNew) row.id = slugify(g.name) || 'juego-' + Date.now();
    row.max_value = row.max_value === '' || row.max_value == null ? null : Number(row.max_value);
    row.image_url = row.image_url?.trim() || null;
    if (row.image_url && !/^https:\/\//.test(row.image_url)) { error = 'La imagen debe ser un enlace que empiece por https://'; return; }
    run(async () => { await upsertGame(row); editing = null; });
  }
  function remove() {
    if (!confirmDel) { confirmDel = true; return; }
    run(async () => { await deleteGame(editing.id); editing = null; });
  }

  onMount(reload);
</script>

<h2>Juegos ({games.filter((g) => g.active).length} activos)</h2>
{#if error}<p class="error" role="alert">{error}</p>{/if}
<ul class="group">
  {#each games as g, i (g.id)}
    <li class="row" class:off={!g.active}>
      <span aria-hidden="true" style="font-size:22px">{g.emoji}</span>
      <button class="grow meta" onclick={() => startEdit(g)}>
        <span class="name">{g.name}</span>
        <span class="small muted">{g.active ? '' : 'Oculto · '}{g.open_mode === 'embed' ? 'En la app' : 'Navegador'} · gana {g.better === 'low' ? 'menos' : 'más'}</span>
      </button>
      <button class="btn quiet sm arrow" disabled={busy || i === 0} onclick={() => move(i, -1)} aria-label="Subir {g.name}">↑</button>
      <button class="btn quiet sm arrow" disabled={busy || i === games.length - 1} onclick={() => move(i, 1)} aria-label="Bajar {g.name}">↓</button>
    </li>
  {/each}
</ul>
<button class="btn quiet block" style="margin-top:10px" onclick={startNew}>Añadir juego</button>

{#if editing}
  <div class="sheet" role="presentation" onclick={(e) => e.target === e.currentTarget && (editing = null)}>
    <div class="panel" role="dialog" aria-modal="true" aria-labelledby="ge-title">
      <button class="closex" onclick={() => (editing = null)} aria-label="Cerrar">✕</button>
      <h2 id="ge-title">{editing.isNew ? 'Añadir juego' : 'Editar juego'}</h2>
      <form onsubmit={(e) => { e.preventDefault(); save(); }} style="margin-top:12px">
        <div style="display:flex;gap:10px">
          <label class="field" style="flex:1"><span>Nombre</span><input bind:value={editing.name} maxlength="40" /></label>
          <label class="field" style="width:84px"><span>Icono</span><input bind:value={editing.emoji} maxlength="8" style="text-align:center;font-size:22px" /></label>
        </div>
        <label class="field"><span>Enlace</span><input bind:value={editing.url} inputmode="url" /></label>
        <label class="field"><span>Imagen (enlace https a una imagen; vacío = dibujo de su categoría)</span><input bind:value={editing.image_url} inputmode="url" placeholder="https://…" /></label>
        <GameArt game={{ ...editing, image_url: editing.image_url || null }} height={72} rounded />
        <div style="height:12px"></div>
        <label class="field"><span>Categoría</span>
          <select bind:value={editing.category}>{#each CATEGORIES as c}<option>{c}</option>{/each}</select></label>
        <label class="field"><span>Cómo se abre</span>
          <select bind:value={editing.open_mode}>
            <option value="embed">Dentro de la app</option>
            <option value="external">En el navegador (si la web no deja abrirse dentro)</option>
          </select></label>
        <label class="field"><span>Quién gana</span>
          <select bind:value={editing.better}>
            <option value="low">Número más bajo (intentos, distancia…)</option>
            <option value="high">Número más alto (puntos, aciertos…)</option>
          </select></label>
        <label class="field"><span>Máximo de intentos (hasta 12 salen botones; vacío = número libre)</span>
          <input bind:value={editing.max_value} inputmode="numeric" placeholder="Por ejemplo: 6" /></label>
        <label class="check"><input type="checkbox" bind:checked={editing.active} /> Visible para todos</label>
        <div class="actions">
          <button class="btn primary" disabled={busy}>{editing.isNew ? 'Añadir' : 'Guardar'}</button>
          {#if !editing.isNew}<button type="button" class="btn danger" disabled={busy} onclick={remove}>{confirmDel ? 'Pulsa otra vez: borra también sus resultados' : 'Borrar'}</button>{/if}
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .meta { background: none; border: 0; padding: 0; text-align: left; cursor: pointer; display: flex; flex-direction: column; }
  .arrow { width: 38px; padding: 0; }
  .off { opacity: .55; }
  .check { display: flex; align-items: center; gap: 10px; margin: 6px 0 14px; font-size: 16px; }
  .check input { width: 22px; height: 22px; }
</style>
