<script>
  // Cabecera ilustrada de un juego: su imagen oficial de vista previa si la tiene;
  // si no (o si no carga), un dibujo propio o la textura de su categoría.
  import { catStyle } from '../lib/categories.js';
  let { game, height = 64, rounded = false } = $props();
  let broken = $state(false);
  // Radar de 5 ejes, como la imagen final de Perceptle (valores decorativos).
  const pt = (i, r) => [Math.sin((i * 2 * Math.PI) / 5) * r, -Math.cos((i * 2 * Math.PI) / 5) * r];
  const pent = (r) => [0, 1, 2, 3, 4].map((i) => pt(i, r).join(',')).join(' ');
  const SCORES = [0.95, 0.91, 0.87, 0.1, 0.68];
  const shape = SCORES.map((s, i) => pt(i, s * 48).join(',')).join(' ');
  const WORD = [['J', '#6AAA64'], ['U', '#C9B458'], ['E', '#787C7E'], ['G', '#6AAA64'], ['O', '#6AAA64']];
</script>

<div class="art" class:rounded style="height:{height}px;{catStyle(game.category)}" aria-hidden="true">
  {#if game.image_url && !broken}
    <img src={game.image_url} alt="" loading="lazy" referrerpolicy="no-referrer" onerror={() => (broken = true)} />
  {:else if game.id === 'wordle-es'}
    <div class="word">{#each WORD as [l, c]}<span style="background:{c}">{l}</span>{/each}</div>
  {:else if game.id === 'poople'}
    <!-- 4 cacas en fila: las 4 letras de la palabra -->
    <div class="poople" style="--h:{height}px"><span>💩</span><span>💩</span><span>💩</span><span>💩</span></div>
  {:else if game.id === 'perceptle'}
    <div class="radar">
      <svg viewBox="-60 -56 120 108">
        {#each [48, 36, 24, 12] as r}<polygon points={pent(r)} fill="none" stroke="#3A4250" stroke-width="1"/>{/each}
        {#each [0, 1, 2, 3, 4] as i}<line x1="0" y1="0" x2={pt(i, 48)[0]} y2={pt(i, 48)[1]} stroke="#3A4250" stroke-width="1"/>{/each}
        <polygon points={shape} fill="rgba(34,211,238,.22)" stroke="#22D3EE" stroke-width="2.5" stroke-linejoin="round"/>
        {#each SCORES as s, i}<circle cx={pt(i, s * 48)[0]} cy={pt(i, s * 48)[1]} r="3" fill="#22D3EE"/>{/each}
      </svg>
    </div>
  {:else if game.id === 'maptap'}
    <svg class="pin" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" fill="#fff"/><circle cx="12" cy="10" r="2.6" fill="var(--c-fill)"/></svg>
  {/if}
</div>

<style>
  .art { position: relative; overflow: hidden; background: var(--c-pat), var(--c-fill); flex: none; }
  .rounded { border-radius: 12px; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .word { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 3%; padding: 0 6%; background: #121213; }
  .word span { flex: 1; max-width: 30px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: clamp(10px, 40%, 18px); border-radius: 3px; }
  .poople { position: absolute; inset: 0; container-type: inline-size; display: flex; align-items: center; justify-content: center; gap: 2%; background: radial-gradient(circle at 50% 40%, #FBF6EE, #EADBC6); }
  .poople span { font-size: min(19cqw, calc(var(--h) * .5)); line-height: 1; filter: drop-shadow(0 1px 1px rgba(80,50,20,.25)); }
  .radar { position: absolute; inset: 0; background: #0D1117; display: flex; align-items: center; justify-content: center; }
  .radar svg { height: 88%; }
  .pin { position: absolute; right: 14%; top: 50%; transform: translateY(-50%); height: 70%; filter: drop-shadow(0 2px 3px rgba(0,0,0,.25)); }
</style>
