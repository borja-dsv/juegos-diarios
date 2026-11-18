<script>
  import { onMount } from 'svelte';
  import { loadPlayers, setStatus, setAdmin, loadAutoApprove, setAutoApprove } from '../lib/admin.js';
  import { humanError } from '../lib/account.js';
  import GamesAdmin from './GamesAdmin.svelte';
  import { getTheme, setTheme } from '../lib/theme.js';

  let { profile, session } = $props();
  let players = $state([]);
  let error = $state('');
  let busyId = $state(null);
  let autoApprove = $state(null);   // null = cargando
  let theme = $state(getTheme());
  const THEMES = [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']];
  function pickTheme(t) { theme = t; setTheme(t); }

  const user = $derived(session?.user);
  const emailOk = $derived(!!user?.email);
  const pending = $derived(players.filter((p) => p.status === 'pending'));
  const members = $derived(players.filter((p) => p.status === 'approved'));

  async function reload() {
    if (!profile.is_admin) return;
    try { [players, autoApprove] = await Promise.all([loadPlayers(), loadAutoApprove()]); } catch (e) { error = humanError(e); }
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
  {#if !emailOk}<p class="small muted">Mientras no confirmes tu email, si borras los datos del navegador perderás la cuenta.</p>{/if}

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
          <span class="grow"><span class="name">{p.username}</span><span class="small muted">{p.is_admin ? 'Admin' : 'Jugador'}</span></span>
          {#if p.id !== profile.id}
            <button class="btn quiet sm" disabled={busyId === p.id} onclick={() => act(p.id, () => setAdmin(p.id, !p.is_admin))}>{p.is_admin ? 'Quitar admin' : 'Hacer admin'}</button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
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
