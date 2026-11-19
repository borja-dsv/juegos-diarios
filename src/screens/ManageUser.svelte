<script>
  // Admins: gestionar la cuenta de un jugador (email de recuperación, enlace de acceso, eliminar).
  import { adminSetEmail, adminDeleteUser, adminSendAccessLink } from '../lib/admin.js';
  import { humanError, EMAIL_RE } from '../lib/account.js';

  let { player, account, onClose, onDone } = $props();
  let email = $state('');
  let busy = $state(false);
  let msg = $state('');
  let error = $state('');
  let confirmDel = $state('');

  async function run(fn, ok) {
    busy = true; msg = ''; error = '';
    try { await fn(); msg = ok; onDone?.(false); } catch (e) { error = e.message?.startsWith('Esta cuenta') ? e.message : humanError(e); } finally { busy = false; }
  }
  const saveEmail = () => run(() => adminSetEmail(player.id, email.trim()), `Email guardado. ${player.username} ya puede entrar desde cualquier dispositivo con «Recupera tu cuenta», o envíale el enlace.`);
  const sendLink = () => run(() => adminSendAccessLink(player.id), `Enlace enviado. Dile a ${player.username} que lo abra en el móvil (mira también en spam). El email llega en inglés.`);
  async function remove() {
    busy = true; error = '';
    try { await adminDeleteUser(player.id); onDone?.(true); } catch (e) { error = humanError(e); busy = false; }
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<div class="sheet" role="presentation" onclick={(e) => e.target === e.currentTarget && onClose()}>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="mu-title">
    <button class="closex" onclick={onClose} aria-label="Cerrar">✕</button>
    <h2 id="mu-title">{player.username}</h2>
    <p class="muted small">Lo que hagas aquí se anuncia en el chat del grupo.</p>

    <h3>Email de recuperación</h3>
    <p class="state">
      {#if account?.email_confirmed}✅ Confirmado: <b>{account.email_masked}</b>
      {:else if account?.email_pending_masked}⏳ Sin confirmar: <b>{account.email_pending_masked}</b>
      {:else}❌ No tiene email: si cambia de móvil o navegador, perderá la cuenta{/if}
    </p>
    <form class="line" onsubmit={(e) => { e.preventDefault(); if (EMAIL_RE.test(email.trim())) saveEmail(); }}>
      <input bind:value={email} type="email" inputmode="email" autocomplete="off" placeholder={account?.email_confirmed ? 'Nuevo email' : 'Su email'} aria-label="Email de {player.username}" />
      <button class="btn primary sm" disabled={busy || !EMAIL_RE.test(email.trim())}>Guardar</button>
    </form>
    <p class="muted small">Queda confirmado al momento: no hace falta que {player.username} pulse ningún enlace.</p>

    <h3>Enviarle acceso</h3>
    <button class="btn quiet block" disabled={busy || !account?.email_confirmed} onclick={sendLink}>✉️ Enviar enlace de acceso a su email</button>
    {#if !account?.email_confirmed}<p class="muted small">Primero ponle un email arriba.</p>{/if}

    {#if msg}<p class="okmsg" role="status">{msg}</p>{/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}

    <h3 class="danger-title">Eliminar cuenta</h3>
    <p class="muted small">Borra a {player.username} y <b>todos sus resultados y mensajes</b>. No se puede deshacer. Escribe su nombre para confirmar:</p>
    <div class="line">
      <input bind:value={confirmDel} autocomplete="off" placeholder={player.username} aria-label="Escribe {player.username} para confirmar" />
      <button class="btn danger sm" disabled={busy || confirmDel.trim() !== player.username} onclick={remove}>Eliminar</button>
    </div>
  </div>
</div>

<style>
  h3 { font-size: 15px; margin: 18px 0 6px; }
  .state { margin: 0 0 8px; font-size: 14px; }
  .line { display: flex; gap: 8px; margin: 6px 0; }
  .line input { flex: 1; min-width: 0; height: 42px; padding: 0 12px; border: 1.5px solid var(--line); border-radius: 10px; background: var(--surface); font-size: 16px; }
  .okmsg { font-size: 14px; color: var(--done); margin: 10px 0 0; }
  .danger-title { color: var(--danger); margin-top: 24px; }
</style>
