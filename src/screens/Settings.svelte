<script>
  import { onMount } from 'svelte';
  import { loadPlayers, setStatus, setAdmin, loadAutoApprove, setAutoApprove, loadAccounts } from '../lib/admin.js';
  import ManageUser from './ManageUser.svelte';
  import { humanError, linkEmail, EMAIL_RE } from '../lib/account.js';
  import GamesAdmin from './GamesAdmin.svelte';
  import { getTheme, setTheme } from '../lib/theme.js';

  let { profile, session } = $props();
  let players = $state([]);
  let error = $state('');
  let busyId = $state(null);
  let newEmail = $state('');
  let emailMsg = $state('');
  async function saveEmail(addr) {
    busyId = 'email'; emailMsg = '';
    try { await linkEmail(addr.trim().toLowerCase()); emailMsg = 'Te hemos enviado un enlace. Ábrelo para confirmar tu email.'; }
    catch (e) { emailMsg = humanError(e); } finally { busyId = null; }
  }
  let autoApprove = $state(null);   // null = cargando
  let accounts = $state({});
  let managing = $state(null);
  let theme = $state(getTheme());
  const THEMES = [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']];
  function pickTheme(t) { theme = t; setTheme(t); }

  const user = $derived(session?.user);
  const emailOk = $derived(!!user?.email);
  const pending = $derived(players.filter((p) => p.status === 'pending'));
  const members = $derived(players.filter((p) => p.status === 'approved'));

  async function reload() {
    if (!profile.is_admin) return;
    try { [players, autoApprove, accounts] = await Promise.all([loadPlayers(), loadAutoApprove(), loadAccounts()]); } catch (e) { error = humanError(e); }
  }
  async function act(id, fn) {
    busyId = id; error = '';
    try { await fn(); await reload(); } catch (e) { error = humanError(e); } finally { busyId = null; }
  }
  onMount(reload);
</script>

<main class="page fade-in">
  <h1>Ajustes</h1>

  <h2>Tu cuenta</h2>
  <ul class="group">
    <li class="row"><span class="grow">Nombre</span><b>{profile.username}</b></li>
    <li class="row"><span class="grow">Rol</span><b>{profile.is_admin ? 'Admin' : 'Jugador'}</b></li>
    <li class="row">
      <span class="grow">Email de recuperación</span>
      {#if emailOk}<b>{user.email}</b>{:else if user?.new_email}<span class="muted small">Confirma el enlace enviado a {user.new_email}</span>{:else}<span class="muted small">Sin email</span>{/if}
    </li>
  </ul>
  {#if !emailOk}
    <div class="note warn">
      <b>Tu cuenta aún no se puede recuperar.</b> Si cambias de móvil, de navegador o borras los datos, la perderás.
      {#if user?.new_email}
        Confirma el enlace que te enviamos a <b>{user.new_email}</b> (mira también en spam).
        <button class="btn quiet sm" style="margin-top:10px" disabled={busyId === 'email'} onclick={() => saveEmail(user.new_email)}>Reenviar enlace</button>
      {:else}
        <form style="display:flex;gap:8px;margin-top:10px" onsubmit={(e) => { e.preventDefault(); if (EMAIL_RE.test(newEmail.trim())) saveEmail(newEmail); }}>
          <input bind:value={newEmail} type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com" aria-label="Tu email" style="flex:1;min-width:0;height:42px;padding:0 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--surface);font-size:16px" />
          <button class="btn primary sm" disabled={busyId === 'email' || !EMAIL_RE.test(newEmail.trim())}>Guardar</button>
        </form>
      {/if}
      {#if emailMsg}<p class="small" style="margin:8px 0 0">{emailMsg}</p>{/if}
    </div>
  {/if}

  <h2>Apariencia</h2>
  <div class="themes" role="radiogroup" aria-label="Apariencia">
    {#each THEMES as [id, label]}
      <button role="radio" aria-checked={theme === id} onclick={() => pickTheme(id)}>{label}</button>
    {/each}
  </div>
  <p class="small muted">«Sistema» sigue el modo claro u oscuro de tu móvil.</p>

  {#if profile.is_admin}
    {#if error}<p class="error" role="alert">{error}</p>{/if}

    <h2>Registro</h2>
    <ul class="group">
      <li class="row">
        <span class="grow">
          <span class="name">Entrar sin aprobación</span>
          <span class="small muted">{autoApprove ? 'Abierto: quien tenga el enlace entra directamente.' : 'Cerrado: un admin aprueba a cada persona nueva.'}</span>
        </span>
        <button class="switch" role="switch" aria-checked={!!autoApprove} aria-label="Entrar sin aprobación" disabled={autoApprove === null || busyId === 'auto'}
          onclick={() => act('auto', async () => { await setAutoApprove(!autoApprove); })}><span></span></button>
      </li>
    </ul>
    {#if autoApprove}<p class="small muted">Comparte el enlace solo con tu grupo, y ciérralo cuando estéis todos.</p>{/if}

    <h2>Solicitudes pendientes</h2>
    {#if pending.length}
      <ul class="group">
        {#each pending as p (p.id)}
          <li class="row">
            <span class="grow"><span class="name">{p.username}</span><span class="small muted">{new Date(p.created_at).toLocaleString('es-ES')}</span></span>
            <button class="btn go sm" disabled={busyId === p.id} onclick={() => act(p.id, () => setStatus(p.id, 'approved'))}>Aceptar</button>
            <button class="btn danger sm" disabled={busyId === p.id} onclick={() => act(p.id, () => setStatus(p.id, 'rejected'))}>Rechazar</button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">No hay nadie esperando.</p>
    {/if}

    <GamesAdmin />

    <h2>Jugadores ({members.length})</h2>
    <ul class="group">
      {#each members as p (p.id)}
        <li class="row">
          <span class="grow"><span class="name">{p.username}</span><span class="small muted">{p.is_admin ? 'Admin' : 'Jugador'} · {accounts[p.id]?.email_confirmed ? '✅ email' : accounts[p.id]?.email_pending_masked ? '⏳ email sin confirmar' : '❌ sin email'}</span></span>
          {#if p.id !== profile.id}
            <button class="btn quiet sm" disabled={busyId === p.id} onclick={() => act(p.id, () => setAdmin(p.id, !p.is_admin))}>{p.is_admin ? 'Quitar admin' : 'Hacer admin'}</button>
            <button class="btn quiet sm" onclick={() => (managing = p)}>Gestionar</button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if managing}<ManageUser player={managing} account={accounts[managing.id]} onClose={() => (managing = null)} onDone={(deleted) => { if (deleted) managing = null; reload(); }} />{/if}
</main>

<style>
  .switch { flex: none; width: 52px; height: 32px; border-radius: 16px; border: 0; padding: 3px; background: var(--line); cursor: pointer; transition: background .2s ease; }
  .switch span { display: block; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform .2s ease; }
  .switch[aria-checked='true'] { background: var(--f-btn-bg, var(--accent)); }
  .switch[aria-checked='true'] span { transform: translateX(20px); }
  .switch:disabled { opacity: .5; }
  @media (prefers-reduced-motion: reduce) { .switch, .switch span { transition: none; } }
  .themes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: var(--line); border-radius: 12px; padding: 3px; height: 44px; }
  .themes button { border: 0; border-radius: 9px; background: transparent; color: var(--muted); font-weight: 600; font-size: 14px; cursor: pointer; }
  .themes button[aria-checked='true'] { background: var(--surface); color: var(--ink); font-weight: 700; box-shadow: 0 1px 3px rgba(11,11,11,.12); }
</style>
