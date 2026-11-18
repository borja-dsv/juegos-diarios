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
        <!-- mapa plano: de España a Japón -->
        <svg class="fill" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">
          <rect width="160" height="90" fill="#CFE6F3"/>
          <g stroke="#B5D4E6" stroke-width=".6">{#each [15, 30, 45, 60, 75] as y}<line x1="0" y1={y} x2="160" y2={y}/>{/each}{#each [20, 40, 60, 80, 100, 120, 140] as x}<line x1={x} y1="0" x2={x} y2="90"/>{/each}</g>
          <g fill="#8CC79A">
            <path d="M8 22c10-8 26-10 34-4 6 5 2 12-6 14-8 2-12 10-18 8-8-3-16-12-10-18z"/>
            <path d="M52 16c14-6 40-8 62-4 18 3 32 8 34 16 1 7-10 10-20 12-10 2-18 10-30 9-12-1-20-6-32-5-10 1-18-4-16-12 1-7 0-12 2-16z"/>
            <path d="M58 46c8-2 16 2 18 10 2 9-4 20-12 22-7 2-12-6-12-14 0-8 0-16 6-18z"/>
            <path d="M118 52c8-2 18 1 22 7 3 6-2 12-10 12-9 0-16-5-17-10 0-4 1-8 5-9z"/>
          </g>
          <path d="M57 30 Q 95 4 136 26" fill="none" stroke="#C0392B" stroke-width="2.2" stroke-dasharray="4 3" stroke-linecap="round"/>
          <path d="M136 26 l-8 -1 4 -6 z" fill="#C0392B" transform="rotate(28 136 26)"/>
          <g transform="translate(51 30)"><rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="#AA151B" stroke="#fff" stroke-width="1"/><rect x="-7" y="-2.5" width="14" height="5" fill="#F1BF00"/></g>
          <g transform="translate(140 32)"><rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="#fff" stroke="#fff" stroke-width="1"/><circle r="2.8" fill="#BC002D"/></g>
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
  .travle { background: #CFE6F3; }
</style>
