<script>
  // Pantalla de un juego: tu resultado con medalla, ranking de hoy, chat y tus estadísticas.
  import { onMount } from 'svelte';
  import { loadGameHistory, rank } from '../lib/results.js';
  import { standings } from '../lib/standings.js';
  import { madridToday } from '../lib/day.js';
  import { catStyle } from '../lib/categories.js';
  import { famStyleFor } from '../lib/palette.js';
  import { humanError } from '../lib/account.js';
  import GameArt from './GameArt.svelte';
  import Chat from './Chat.svelte';
  import CorrectSheet from './CorrectSheet.svelte';
  import DiceIcon from './DiceIcon.svelte';

  let { game, me, isAdmin = false, mine = null, next = null, onBack, onPlay, onRecord, onPlayNext = null } = $props();
  let history = $state([]);
  let error = $state('');
  let loaded = $state(false);
  let chatOpen = $state(false);
  let correcting = $state(null);   // resultado que un admin está corrigiendo

  const today = madridToday();
  const todayRows = $derived(rank(history.filter((r) => r.day === today), game.better));
  const myToday = $derived(todayRows.find((r) => r.user_id === me));
  const past = $derived(history.filter((r) => r.day < today));
  const myPast = $derived(history.filter((r) => r.user_id === me && r.value != null && !r.failed));
  const myWins = $derived(standings(history, () => game.better).find((t) => t.user_id === me)?.wins ?? 0);
  const avg = $derived(myPast.length ? myPast.reduce((s, r) => s + Number(r.value), 0) / myPast.length : null);
  const fmt = (n) => (n == null ? '—' : String(Math.round(n * 100) / 100).replace('.', ','));

  async function reload() {
    try { history = await loadGameHistory(game.id); } catch (e) { error = humanError(e); }
    loaded = true;
  }
  onMount(reload);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && !chatOpen && onBack()} />

<div class="screen fade-in fam" role="dialog" aria-modal="true" aria-label={game.name} style="{catStyle(game.category)};{famStyleFor(game.id)}">
  <header>
    <GameArt {game} height={176} />
    <div class="shade"></div>
    <button class="back" onclick={onBack} aria-label="Volver a Hoy">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
    </button>
    <div class="title">
      <span class="badge" aria-hidden="true">{game.emoji}</span>
      <div>
        <h1>{game.name}</h1>
        <span class="sub">{game.category} · gana el {game.better === 'low' ? 'más bajo' : 'más alto'}</span>
      </div>
    </div>
  </header>

  <main>
    {#if error}<p class="error">{error}</p>{/if}

    {#if mine}
      <div class="you">
        <div class="grow">
          <span class="lbl">Tu resultado</span>
          <span class="num big">{mine.display}</span>
          <span class="small" class:ok={mine.source === 'share'}>{mine.source === 'share' ? 'Verificado con el texto de Compartir' : 'Apuntado a mano'}</span>
        </div>
        {#if myToday?.pos}
          <div class="bigmedal medal p{myToday.pos}" aria-label="Puesto {myToday.pos} de {todayRows.length}"><span class="num">{myToday.pos}º</span><span>/{todayRows.length}</span></div>
        {/if}
      </div>

      {#if next}
        <button class="nextcard fam" style={famStyleFor(next.id)} onclick={() => onPlayNext?.(next)} aria-label="Siguiente juego: jugar a {next.name}">
          <span class="nthumb"><GameArt game={next} height={56} rounded /></span>
          <span class="ntext"><span class="nlabel">Siguiente juego</span><span class="nname">{next.name}</span><span class="ncat">{next.category}</span></span>
          <span class="nplay"><DiceIcon size={30} /></span>
        </button>
      {:else}
        <div class="alldone">🎉 Has terminado todos los juegos de hoy</div>
      {/if}
      <button class="btn quiet block" onclick={onPlay}><DiceIcon size={22} />Volver a jugar <span class="keep">(tu resultado no cambia)</span></button>
      <button class="btn block chat" onclick={() => (chatOpen = true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"></path></svg>
        Chat de {game.name}
      </button>

      <div class="head"><h2>Ranking de hoy</h2><span class="small muted">{todayRows.length} {todayRows.length === 1 ? 'ha jugado' : 'han jugado'}</span></div>
      <ol class="group">
        {#each todayRows as r (r.id)}
          <li class="row" class:me={r.user_id === me}>
            <span class="medal {r.pos ? 'p' + r.pos : ''}">{r.pos ?? '—'}</span>
            <span class="grow"><span class="name">{r.profiles?.username}{r.user_id === me ? ' (tú)' : ''}</span><span class="small muted" class:fixed={r.corrected_by}>{r.corrected_by ? 'corregido por admin' : r.source === 'share' ? 'verificado' : 'manual'}</span></span>
            <span class="num res">{r.display}</span>
            {#if isAdmin}<button class="fix" onclick={() => (correcting = r)} aria-label="Corregir el resultado de {r.profiles?.username}">Corregir</button>{/if}
          </li>
        {/each}
      </ol>
    {:else}
      <div class="you">
        <div class="grow">
          <span class="lbl">Hoy</span>
          <span class="small">Aún no lo has jugado. El ranking de hoy y el chat de {game.name} se desbloquean al apuntar tu resultado.</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" onclick={onPlay}><DiceIcon size={24} />Jugar</button>
        <button class="btn quiet" onclick={onRecord}>Apuntar resultado</button>
      </div>
    {/if}

    {#if loaded}
      <h2>Tú en {game.name}</h2>
      <div class="stats3">
        <div class="stat"><span class="k">Partidas</span><span class="v">{history.filter((r) => r.user_id === me).length}</span></div>
        <div class="stat"><span class="k">Media</span><span class="v">{fmt(avg)}</span></div>
        <div class="stat"><span class="k">Victorias</span><span class="v">{myWins}</span></div>
      </div>
      {#if !past.length}<p class="small muted">Las estadísticas crecerán día a día.</p>{/if}
    {/if}
  </main>
</div>

{#if correcting}<CorrectSheet {game} row={correcting} onClose={() => (correcting = null)} onDone={() => { correcting = null; reload(); }} />{/if}
{#if chatOpen}<Chat channel={game.id} title={`Chat de ${game.name}`} {me} {game} onBack={() => (chatOpen = false)} />{/if}

<style>
  .screen { position: fixed; inset: 0; z-index: 25; background: var(--bg); overflow-y: auto; }
  header { position: relative; max-width: 560px; margin: 0 auto; }
  @media (min-width: 600px) { header { margin-top: 16px; border-radius: 20px; overflow: hidden; } }
  .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.3), rgba(0,0,0,0) 35%, rgba(0,0,0,.72)); }
  .back { position: absolute; top: calc(12px + env(safe-area-inset-top, 0px)); left: 14px; width: 44px; height: 44px; border-radius: 22px; border: 0; background: rgba(0,0,0,.35); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .title { position: absolute; left: 16px; right: 16px; bottom: -30px; display: flex; align-items: flex-end; gap: 12px; }
  .title h1 { color: #fff; font-size: 30px; margin: 0; text-shadow: 0 1px 8px rgba(0,0,0,.35); }
  .sub { display: block; color: rgba(255,255,255,.92); font-size: 13px; font-weight: 600; padding-bottom: 36px; text-shadow: 0 1px 6px rgba(0,0,0,.4); }
  .badge { width: 64px; height: 64px; flex: none; border-radius: 20px; background: var(--surface); border: 3px solid var(--bg); display: flex; align-items: center; justify-content: center; font-size: 32px; }
  main { max-width: 560px; margin: 0 auto; padding: 46px 16px calc(32px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; gap: 12px; }
  main h2 { margin: 8px 0 0; }
  .you { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; display: flex; align-items: center; gap: 14px; }
  .lbl { display: block; font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
  .big { display: block; font-size: 32px; }
  .ok { color: var(--done); font-weight: 600; }
  .bigmedal { width: 72px; height: 72px; flex-direction: column; font-size: 11px; font-weight: 700; }
  .bigmedal .num { font-size: 26px; line-height: 1; }
  .chat { background: var(--f-soft-bg); color: var(--f-soft-fg); }
  .nextcard { display: flex; align-items: center; gap: 14px; width: 100%; padding: 12px; border: 0; border-radius: var(--radius); background: var(--f-soft-bg); color: var(--ink); text-align: left; cursor: pointer; transition: transform .12s ease; animation: pop .35s ease-out; }
  .nextcard:active { transform: scale(.98); }
  .nthumb { width: 56px; flex: none; }
  .ntext { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .nlabel { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--f-soft-fg); }
  .nname { font-family: var(--display); font-size: 19px; font-weight: 800; }
  .ncat { font-size: 13px; color: var(--muted); }
  .nplay { width: 52px; height: 52px; flex: none; border-radius: 14px; background: var(--f-btn-bg); display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px color-mix(in srgb, var(--f-btn-bg) 40%, transparent); }
  .alldone { padding: 14px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--line); text-align: center; font-weight: 650; }
  @keyframes pop { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .nextcard { animation: none; transition: none; } }
  .keep { font-size: 13px; font-weight: 500; opacity: .85; }
  .head { display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px; }
  .head h2 { margin: 0; }
  ol.group { padding: 0; }
  .me { background: color-mix(in srgb, var(--accent) 12%, transparent); }
  .res { font-size: 19px; }
  .fix { height: 32px; padding: 0 10px; border-radius: 10px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 12px; font-weight: 650; cursor: pointer; flex: none; }
  .fixed { color: var(--amber); font-weight: 600; }
  .stats3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
</style>
