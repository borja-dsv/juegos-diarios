<script>
  // Chat en tiempo real: general o de un juego (el de un juego, solo de hoy).
  import { onMount, tick } from 'svelte';
  import { loadMessages, sendMessage, subscribe, usernameOf } from '../lib/chat.js';
  import { madridToday } from '../lib/day.js';
  import { humanError } from '../lib/account.js';
  import { catStyle } from '../lib/categories.js';
  import { famStyleFor } from '../lib/palette.js';

  let { channel, title, me, game = null, onBack = null } = $props();
  let msgs = $state([]);
  let text = $state('');
  let error = $state('');
  let busy = $state(false);
  let list;
  const names = new Map();

  async function scrollDown() { await tick(); list?.scrollTo({ top: list.scrollHeight }); }
  const time = (t) => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
  const dayLabel = (d) => (d === madridToday() ? 'Hoy' : new Date(d + 'T12:00:00Z').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));

  async function add(m) {
    if (msgs.some((x) => x.id === m.id)) return;
    if (!m.profiles && m.user_id) {
      if (!names.has(m.user_id)) names.set(m.user_id, await usernameOf(m.user_id));
      m = { ...m, profiles: { username: names.get(m.user_id) } };
    }
    msgs = [...msgs, m];
    scrollDown();
  }

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    busy = true; error = '';
    try { await sendMessage(channel, body); text = ''; }
    catch (err) { error = humanError(err); }
    finally { busy = false; }
  }

  onMount(() => {
    loadMessages(channel).then((m) => { msgs = m; scrollDown(); }).catch((e) => (error = humanError(e)));
    return subscribe(channel, add);
  });
</script>

<div class="chat fam" class:full={!!onBack} style={game ? `${catStyle(game.category)};${famStyleFor(game.id)}` : ''}>
  <header>
    {#if onBack}
      <button class="back" onclick={onBack} aria-label="Volver">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
      </button>
    {/if}
    {#if game}<span class="gbadge" aria-hidden="true">{game.emoji}</span>{/if}
    <div class="grow">
      <h1>{title}</h1>
      <span class="small muted">{game ? 'Solo quien ya ha jugado hoy' : 'Todo el grupo'}</span>
    </div>
  </header>

  <div class="list" bind:this={list} aria-live="polite">
    {#if !msgs.length && !error}<p class="empty muted">Aún no hay mensajes. ¡Rompe el hielo!</p>{/if}
    {#each msgs as m, i (m.id)}
      {#if i === 0 || msgs[i - 1].day !== m.day}<div class="day">{dayLabel(m.day)}</div>{/if}
      {#if m.kind === 'system'}
        <div class="sys"><span class="dot" class:ok={m.body.endsWith('verificado')}></span>{m.body}</div>
      {:else}
        <div class="msg" class:mine={m.user_id === me}>
          {#if m.user_id !== me}<span class="who">{m.profiles?.username}</span>{/if}
          <div class="bubble">{m.body}</div>
          <span class="time">{time(m.created_at)}</span>
        </div>
      {/if}
    {/each}
  </div>

  {#if error}<p class="error" style="padding:0 14px">{error}</p>{/if}
  <form onsubmit={send}>
    <label class="grow"><span class="sr">Mensaje</span>
      <input bind:value={text} maxlength="500" placeholder="Escribe un mensaje…" autocomplete="off" enterkeyhint="send" />
    </label>
    <button class="sendbtn" disabled={busy || !text.trim()} aria-label="Enviar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
    </button>
  </form>
</div>

<style>
  .chat { display: flex; flex-direction: column; height: calc(100dvh - 61px - env(safe-area-inset-bottom, 0px)); max-width: 560px; margin: 0 auto; }
  .chat.full { position: fixed; inset: 0; z-index: 35; height: 100dvh; max-width: none; background: var(--bg); }
  header { display: flex; align-items: center; gap: 12px; padding: calc(14px + env(safe-area-inset-top, 0px)) 14px 12px; background: var(--surface); border-bottom: 1px solid var(--line); }
  header h1 { font-size: 20px; margin: 0; }
  .back { width: 40px; height: 40px; border-radius: 20px; border: 0; background: var(--line); color: var(--ink); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .gbadge { width: 40px; height: 40px; border-radius: 12px; background: var(--c-pat), var(--c-fill); display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .list { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
  .empty { text-align: center; margin-top: 40px; }
  .day { align-self: center; font-size: 12px; font-weight: 700; color: var(--muted); margin: 8px 0 2px; text-transform: capitalize; }
  .sys { align-self: center; display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 12px; background: var(--surface); border: 1px solid var(--line); font-size: 13px; color: var(--muted); max-width: 90%; }
  .dot { width: 8px; height: 8px; flex: none; border-radius: 50%; background: var(--amber); } .dot.ok { background: var(--done); }
  .msg { display: flex; flex-direction: column; gap: 3px; max-width: 78%; align-self: flex-start; }
  .msg.mine { align-self: flex-end; align-items: flex-end; }
  .who { font-size: 12px; font-weight: 700; color: var(--muted); }
  .bubble { padding: 10px 14px; border-radius: 18px 18px 18px 6px; background: var(--surface); border: 1px solid var(--line); font-size: 15px; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; }
  .mine .bubble { border-radius: 18px 18px 6px 18px; background: var(--f-btn-bg, var(--accent)); color: var(--f-btn-fg, var(--accent-ink)); border-color: transparent; }
  .time { font-size: 11px; color: var(--muted); }
  form { display: flex; gap: 8px; padding: 10px 12px calc(10px + (var(--full, 0) * 1px)); background: var(--surface); border-top: 1px solid var(--line); }
  .full form { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }
  form label { flex: 1; min-width: 0; display: flex; }
  form input { flex: 1; min-width: 0; height: 46px; border-radius: 23px; border: 1px solid var(--line); background: var(--bg); padding: 0 16px; font-size: 16px; }
  .sendbtn { width: 46px; height: 46px; flex: none; border-radius: 50%; border: 0; background: var(--f-btn-bg, var(--accent)); color: var(--f-btn-fg, var(--accent-ink)); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .sendbtn:disabled { opacity: .5; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
