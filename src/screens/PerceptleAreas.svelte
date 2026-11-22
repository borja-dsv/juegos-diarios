<script>
  // Perceptle: tus 5 áreas en barras y un mini ranking de hoy por área (más alto = mejor).
  let { rows = [], me, mine = null } = $props();
  const AREAS = [['count', '🔢', 'Count'], ['track', '🎯', 'Track'], ['angle', '📐', 'Angle'], ['tempo', '🥁', 'Tempo'], ['split', '✂️', 'Split']];
  let area = $state('count');

  const withAreas = $derived(rows.filter((r) => r.details && typeof r.details[area] === 'number'));
  const ranked = $derived.by(() => {
    const sorted = [...withAreas].sort((a, b) => b.details[area] - a.details[area]);
    let pos = 0;
    return sorted.map((r, i) => { if (i === 0 || sorted[i - 1].details[area] !== r.details[area]) pos = i + 1; return { ...r, apos: pos }; });
  });
  const best = $derived(mine?.details ? AREAS.reduce((b, a) => (mine.details[a[0]] > mine.details[b[0]] ? a : b)) : null);
</script>

{#if mine?.details}
  <h2>Tus áreas hoy</h2>
  <div class="bars">
    {#each AREAS as [k, ico, name]}
      <div class="bar">
        <span class="lbl"><span aria-hidden="true">{ico}</span> {name}</span>
        <span class="track"><span class="fill" style="width:{Math.max(2, mine.details[k])}%"></span></span>
        <b class="val">{mine.details[k]}</b>
      </div>
    {/each}
  </div>
  {#if best}<p class="small muted">Tu mejor área hoy: <b>{best[1]} {best[2]}</b>.</p>{/if}
{/if}

{#if rows.some((r) => r.details)}
  <h2>Ranking por áreas</h2>
  <div class="chips" role="group" aria-label="Área">
    {#each AREAS as [k, ico, name]}
      <button aria-pressed={area === k} onclick={() => (area = k)}><span aria-hidden="true">{ico}</span> {name}</button>
    {/each}
  </div>
  <ol class="group">
    {#each ranked as r (r.id)}
      <li class="row" class:me={r.user_id === me}>
        <span class="medal {r.apos <= 3 ? 'p' + r.apos : ''}">{r.apos}</span>
        <span class="grow name">{r.profiles?.username}{r.user_id === me ? ' (tú)' : ''}</span>
        <span class="num score">{r.details[area]}</span>
      </li>
    {/each}
  </ol>
  {#if rows.some((r) => !r.details)}<p class="small muted">Solo salen quienes pegaron el texto de Compartir: lo apuntado a mano no trae las áreas.</p>{/if}
{/if}

<style>
  h2 { margin: 8px 0 0; }
  .bars { display: flex; flex-direction: column; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; }
  .bar { display: grid; grid-template-columns: 92px minmax(0, 1fr) 34px; align-items: center; gap: 10px; }
  .lbl { font-size: 14px; font-weight: 600; white-space: nowrap; }
  .track { height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; }
  .fill { display: block; height: 100%; border-radius: 4px; background: var(--f-btn-bg, var(--accent)); }
  .val { text-align: right; font-variant-numeric: tabular-nums; }
  .chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .chips::-webkit-scrollbar { display: none; }
  .chips button { flex: none; height: 36px; padding: 0 12px; border-radius: 18px; border: 1px solid var(--line); background: var(--surface); font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .chips button[aria-pressed='true'] { background: var(--f-btn-bg, var(--ink)); color: var(--f-btn-fg, var(--bg)); border-color: transparent; }
  ol.group { padding: 0; }
  .me { background: color-mix(in srgb, var(--accent) 12%, transparent); }
  .score { font-size: 19px; }
</style>
