<script>
  // Imagen de cada juego. Prioridad:
  // 1) un dibujo propio (ART), elegido con Borja para cada juego;
  // 2) la imagen oficial de vista previa del juego (image_url), con encuadre opcional (FOCUS);
  // 3) la textura de su categoría.
  import { catStyle } from '../lib/categories.js';
  let { game, height = 64, rounded = false } = $props();
  let broken = $state(false);

  const ART = new Set(['wordle-es', 'poople', 'perceptle', 'krillion', 'maptap', 'travle', 'size-it-up', 'noilirk', 'stranded', 'worldle', 'flagle', 'timeguessr', 'whenere']);
  // Encuadre de imágenes oficiales: centrar al protagonista (Fermi: el señor de la derecha).
  const FOCUS = { fermi: 'object-position: 91% 28%; transform: scale(1.9); transform-origin: 91% 28%;' };

  // Perceptle: radar de 5 ejes (valores decorativos)
  const pt = (i, r) => [Math.sin((i * 2 * Math.PI) / 5) * r, -Math.cos((i * 2 * Math.PI) / 5) * r];
  const pent = (r) => [0, 1, 2, 3, 4].map((i) => pt(i, r).join(',')).join(' ');
  const SCORES = [0.95, 0.91, 0.87, 0.1, 0.68];
  const shape = SCORES.map((s, i) => pt(i, s * 48).join(',')).join(' ');
  const WORD = [['J', '#6AAA64'], ['U', '#C9B458'], ['E', '#787C7E'], ['G', '#6AAA64'], ['O', '#6AAA64']];
</script>

<div class="art" class:rounded style="height:{height}px;{catStyle(game.category)}" aria-hidden="true">
  {#if ART.has(game.id)}
    <div class="scene {game.id}">
      {#if game.id === 'wordle-es'}
        <div class="word">{#each WORD as [l, c]}<span style="background:{c}">{l}</span>{/each}</div>
      {:else if game.id === 'poople'}
        <!-- 4 cacas en fila: las 4 letras de la palabra -->
        <div class="row4"><span>💩</span><span>💩</span><span>💩</span><span>💩</span></div>
      {:else if game.id === 'perceptle'}
        <svg class="fill" viewBox="-60 -56 120 108">
          {#each [48, 36, 24, 12] as r}<polygon points={pent(r)} fill="none" stroke="#3A4250" stroke-width="1"/>{/each}
          {#each [0, 1, 2, 3, 4] as i}<line x1="0" y1="0" x2={pt(i, 48)[0]} y2={pt(i, 48)[1]} stroke="#3A4250" stroke-width="1"/>{/each}
          <polygon points={shape} fill="rgba(34,211,238,.22)" stroke="#22D3EE" stroke-width="2.5" stroke-linejoin="round"/>
          {#each SCORES as s, i}<circle cx={pt(i, s * 48)[0]} cy={pt(i, s * 48)[1]} r="3" fill="#22D3EE"/>{/each}
        </svg>
      {:else if game.id === 'krillion'}
        <span class="big">🦐</span><i class="bub b1"></i><i class="bub b2"></i><i class="bub b3"></i>
      {:else if game.id === 'stranded'}
        <span class="big">👽</span>
      {:else if game.id === 'worldle'}
        <span class="big europe">🌍</span>
      {:else if game.id === 'timeguessr'}
        <span class="big">⏳</span>
      {:else if game.id === 'maptap'}
        <span class="big">🌍</span><span class="corner pin">📍</span>
      {:else if game.id === 'whenere'}
        <span class="big">🌍</span><span class="corner clock">🕰️</span>
      {:else if game.id === 'noilirk'}
        <span class="big">👥</span><span class="corner think">💭</span>
      {:else if game.id === 'size-it-up'}
        <div class="sizes"><span class="small">🐭</span><span class="large">🐘</span></div><i class="ground"></i>
      {:else if game.id === 'flagle'}
        <!-- banderas dibujadas (los emojis de bandera salen como letras en Windows) -->
        <svg class="fill" viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(8 8)"><rect width="32" height="22" rx="3" fill="#AA151B"/><rect y="5.5" width="32" height="11" fill="#F1BF00"/></g>
          <g transform="translate(44 8)"><rect width="32" height="22" rx="3" fill="#fff"/><circle cx="16" cy="11" r="6" fill="#BC002D"/></g>
          <g transform="translate(80 8)"><rect width="32" height="22" rx="3" fill="#002395"/><rect x="10.7" width="10.6" height="22" fill="#fff"/><rect x="21.3" width="10.7" height="22" rx="0" fill="#ED2939"/></g>
          <g transform="translate(8 46)"><rect width="32" height="22" rx="3" fill="#009246"/><rect x="10.7" width="10.6" height="22" fill="#fff"/><rect x="21.3" width="10.7" height="22" fill="#CE2B37"/></g>
          <g transform="translate(44 46)"><rect width="32" height="22" rx="3" fill="#000"/><rect y="7.3" width="32" height="7.4" fill="#DD0000"/><rect y="14.7" width="32" height="7.3" fill="#FFCE00"/></g>
          <g transform="translate(80 46)"><rect width="32" height="22" rx="3" fill="#009C3B"/><path d="M16 3 L29 11 L16 19 L3 11 Z" fill="#FFDF00"/><circle cx="16" cy="11" r="4.6" fill="#002776"/></g>
        </svg>
      {:else if game.id === 'travle'}
        <!-- mapamundi de puntos (Natural Earth, dominio público) con flecha de España a Japón -->
        <svg class="fill" viewBox="0 0 160 80" preserveAspectRatio="xMidYMid meet">
          <path d="M27 1.8h0M37.8 1.8h0M52.2 1.8h0M55.8 1.8h0M59.4 1.8h0M63 1.8h0M117 1.8h0M120.6 1.8h0M124.2 1.8h0M138.6 1.8h0M142.2 1.8h0M5.4 5.4h0M9 5.4h0M12.6 5.4h0M16.2 5.4h0M19.8 5.4h0M23.4 5.4h0M27 5.4h0M34.2 5.4h0M37.8 5.4h0M45 5.4h0M55.8 5.4h0M59.4 5.4h0M63 5.4h0M84.6 5.4h0M88.2 5.4h0M91.8 5.4h0M106.2 5.4h0M109.8 5.4h0M113.4 5.4h0M117 5.4h0M120.6 5.4h0M124.2 5.4h0M127.8 5.4h0M131.4 5.4h0M135 5.4h0M138.6 5.4h0M142.2 5.4h0M145.8 5.4h0M149.4 5.4h0M153 5.4h0M5.4 9h0M9 9h0M12.6 9h0M16.2 9h0M19.8 9h0M23.4 9h0M27 9h0M30.6 9h0M34.2 9h0M45 9h0M55.8 9h0M81 9h0M88.2 9h0M91.8 9h0M95.4 9h0M99 9h0M102.6 9h0M106.2 9h0M109.8 9h0M113.4 9h0M117 9h0M120.6 9h0M124.2 9h0M127.8 9h0M131.4 9h0M135 9h0M138.6 9h0M142.2 9h0M145.8 9h0M149.4 9h0M153 9h0M5.4 12.6h0M19.8 12.6h0M23.4 12.6h0M27 12.6h0M30.6 12.6h0M34.2 12.6h0M45 12.6h0M73.8 12.6h0M81 12.6h0M88.2 12.6h0M91.8 12.6h0M95.4 12.6h0M99 12.6h0M102.6 12.6h0M106.2 12.6h0M109.8 12.6h0M113.4 12.6h0M117 12.6h0M120.6 12.6h0M124.2 12.6h0M127.8 12.6h0M131.4 12.6h0M135 12.6h0M145.8 12.6h0M19.8 16.2h0M23.4 16.2h0M27 16.2h0M30.6 16.2h0M34.2 16.2h0M37.8 16.2h0M41.4 16.2h0M45 16.2h0M48.6 16.2h0M73.8 16.2h0M77.4 16.2h0M81 16.2h0M84.6 16.2h0M88.2 16.2h0M91.8 16.2h0M95.4 16.2h0M99 16.2h0M102.6 16.2h0M106.2 16.2h0M109.8 16.2h0M113.4 16.2h0M117 16.2h0M120.6 16.2h0M124.2 16.2h0M127.8 16.2h0M131.4 16.2h0M135 16.2h0M23.4 19.8h0M27 19.8h0M30.6 19.8h0M34.2 19.8h0M37.8 19.8h0M41.4 19.8h0M45 19.8h0M77.4 19.8h0M81 19.8h0M84.6 19.8h0M88.2 19.8h0M95.4 19.8h0M99 19.8h0M102.6 19.8h0M106.2 19.8h0M109.8 19.8h0M113.4 19.8h0M117 19.8h0M120.6 19.8h0M124.2 19.8h0M127.8 19.8h0M131.4 19.8h0M135 19.8h0M138.6 19.8h0M23.4 23.4h0M27 23.4h0M30.6 23.4h0M34.2 23.4h0M37.8 23.4h0M41.4 23.4h0M73.8 23.4h0M88.2 23.4h0M91.8 23.4h0M95.4 23.4h0M102.6 23.4h0M106.2 23.4h0M109.8 23.4h0M113.4 23.4h0M117 23.4h0M120.6 23.4h0M124.2 23.4h0M127.8 23.4h0M131.4 23.4h0M27 27h0M30.6 27h0M34.2 27h0M37.8 27h0M73.8 27h0M77.4 27h0M81 27h0M91.8 27h0M95.4 27h0M99 27h0M102.6 27h0M106.2 27h0M109.8 27h0M113.4 27h0M117 27h0M120.6 27h0M124.2 27h0M127.8 27h0M27 30.6h0M30.6 30.6h0M70.2 30.6h0M73.8 30.6h0M77.4 30.6h0M81 30.6h0M84.6 30.6h0M88.2 30.6h0M91.8 30.6h0M95.4 30.6h0M102.6 30.6h0M106.2 30.6h0M109.8 30.6h0M113.4 30.6h0M117 30.6h0M120.6 30.6h0M124.2 30.6h0M127.8 30.6h0M30.6 34.2h0M41.4 34.2h0M70.2 34.2h0M73.8 34.2h0M77.4 34.2h0M81 34.2h0M84.6 34.2h0M88.2 34.2h0M91.8 34.2h0M95.4 34.2h0M99 34.2h0M109.8 34.2h0M113.4 34.2h0M117 34.2h0M120.6 34.2h0M37.8 37.8h0M70.2 37.8h0M73.8 37.8h0M77.4 37.8h0M81 37.8h0M84.6 37.8h0M88.2 37.8h0M91.8 37.8h0M95.4 37.8h0M109.8 37.8h0M120.6 37.8h0M45 41.4h0M70.2 41.4h0M73.8 41.4h0M77.4 41.4h0M81 41.4h0M84.6 41.4h0M88.2 41.4h0M91.8 41.4h0M95.4 41.4h0M109.8 41.4h0M127.8 41.4h0M131.4 41.4h0M41.4 45h0M45 45h0M48.6 45h0M52.2 45h0M81 45h0M84.6 45h0M88.2 45h0M91.8 45h0M95.4 45h0M127.8 45h0M41.4 48.6h0M45 48.6h0M48.6 48.6h0M52.2 48.6h0M55.8 48.6h0M81 48.6h0M84.6 48.6h0M88.2 48.6h0M91.8 48.6h0M135 48.6h0M138.6 48.6h0M41.4 52.2h0M45 52.2h0M48.6 52.2h0M52.2 52.2h0M55.8 52.2h0M59.4 52.2h0M84.6 52.2h0M88.2 52.2h0M91.8 52.2h0M45 55.8h0M48.6 55.8h0M52.2 55.8h0M55.8 55.8h0M81 55.8h0M84.6 55.8h0M88.2 55.8h0M91.8 55.8h0M131.4 55.8h0M135 55.8h0M138.6 55.8h0M45 59.4h0M48.6 59.4h0M52.2 59.4h0M55.8 59.4h0M84.6 59.4h0M88.2 59.4h0M95.4 59.4h0M127.8 59.4h0M131.4 59.4h0M135 59.4h0M138.6 59.4h0M149.4 59.4h0M45 63h0M48.6 63h0M52.2 63h0M84.6 63h0M88.2 63h0M127.8 63h0M131.4 63h0M135 63h0M138.6 63h0M142.2 63h0M45 66.6h0M48.6 66.6h0M84.6 66.6h0M127.8 66.6h0M138.6 66.6h0M142.2 66.6h0M45 70.2h0M153 70.2h0M45 73.8h0M48.6 77.4h0" stroke="#7FA7C9" stroke-width="2.1" stroke-linecap="round" opacity=".85"/>
          <path d="M73.9 22.4 Q 105.8 2.4 135.1 23.7" fill="none" stroke="#FF7A59" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="5 3.5"/>
          <path d="M138.8 25.9 l-7.2 -1.2 3.4 -5.8 z" fill="#FF7A59" transform="rotate(14 137.6 25.3)"/>
          <circle cx="73.9" cy="22.4" r="2.6" fill="#FF7A59"/>
        </svg>
      {/if}
    </div>
  {:else if game.image_url && !broken}
    <img src={game.image_url} alt="" loading="lazy" referrerpolicy="no-referrer" style={FOCUS[game.id] ?? ''} onerror={() => (broken = true)} />
  {/if}
</div>

<style>
  .art { position: relative; overflow: hidden; background: var(--c-pat), var(--c-fill); flex: none; }
  .rounded { border-radius: 12px; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

  /* Escena: el tamaño de los emojis se adapta al hueco (miniatura de 48 px o cabecera de 176 px) */
  .scene { position: absolute; inset: 0; container-type: size; display: flex; align-items: center; justify-content: center; }
  .scene span { line-height: 1; filter: drop-shadow(0 2px 2px rgba(0,0,0,.22)); }
  .big { font-size: 66cqmin; }
  .corner { position: absolute; font-size: 36cqmin; }
  .fill { width: 100%; height: 100%; }

  .wordle-es { background: #121213; }
  .word { display: flex; align-items: center; justify-content: center; gap: 3%; padding: 0 6%; width: 100%; }
  .word span { flex: 1; max-width: 30px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: clamp(10px, 40%, 18px); border-radius: 3px; filter: none; }

  .poople { background: radial-gradient(circle at 50% 40%, #FBF6EE, #EADBC6); }
  .row4 { display: flex; gap: 2%; }
  .row4 span { font-size: min(19cqw, 50cqh); }

  .perceptle { background: #0D1117; }
  .perceptle .fill { height: 88%; }

  .krillion { background: radial-gradient(circle at 35% 30%, #2A9BC7, #0B4F7A 70%); }
  .bub { position: absolute; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.55); }
  .b1 { width: 7cqmin; height: 7cqmin; left: 18%; top: 22%; } .b2 { width: 5cqmin; height: 5cqmin; left: 24%; top: 40%; } .b3 { width: 9cqmin; height: 9cqmin; right: 16%; top: 16%; }

  .stranded { background: radial-gradient(circle at 70% 30%, #2B3A7A, #0B1026 70%), #0B1026;
    background-image: radial-gradient(circle at 70% 30%, transparent, #0B1026 75%), radial-gradient(1.2px 1.2px at 20% 25%, #fff, transparent), radial-gradient(1px 1px at 80% 70%, #fff, transparent), radial-gradient(1.4px 1.4px at 35% 80%, #fff, transparent), radial-gradient(1px 1px at 88% 18%, #fff, transparent), radial-gradient(circle at 70% 30%, #2B3A7A, #0B1026); }

  /* Worldle: el globo ampliado y desplazado para que se vea sobre todo Europa */
  .worldle { background: #CFE6F3; }
  .europe { font-size: 150cqmin; transform: translate(-6%, 28%); }

  .timeguessr { background: radial-gradient(circle at 50% 35%, #F3E3C3, #C9A46A); }
  .maptap { background: radial-gradient(circle at 50% 40%, #D9F0E6, #8FD1B5); }
  .maptap .pin { right: 14%; top: 6%; }
  .whenere { background: radial-gradient(circle at 50% 40%, #E7E2F5, #A99BD6); }
  .whenere .big { font-size: 58cqmin; transform: translate(-12%, 4%); }
  .whenere .clock { right: 10%; bottom: 6%; }
  .noilirk { background: radial-gradient(circle at 50% 40%, #FFF0D8, #F2C27B); }
  .noilirk .big { font-size: 58cqmin; transform: translateY(10%); }
  .noilirk .think { right: 12%; top: 4%; }

  .size-it-up { background: linear-gradient(#FCEDEA, #F6C9C1); }
  .sizes { display: flex; align-items: flex-end; gap: 4%; transform: translateY(6%); }
  .sizes .small { font-size: 30cqmin; }
  .sizes .large { font-size: 64cqmin; }
  .ground { position: absolute; left: 12%; right: 12%; bottom: 14%; height: 2px; background: rgba(120,40,30,.35); border-radius: 1px; }

  .flagle { background: #1E2A44; }
  .travle { background: radial-gradient(circle at 50% 30%, #1E3A5C, #0E1E33 75%); }
  .travle .fill { width: 96%; height: 96%; }
</style>
