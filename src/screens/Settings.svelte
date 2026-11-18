<script>
  import { onMount } from 'svelte';
  import { loadPlayers, setStatus, setAdmin } from '../lib/admin.js';
  import { humanError } from '../lib/account.js';

  let { profile, session } = $props();
  let players = $state([]);
  let error = $state('');
  let busyId = $state(null);

  const user = $derived(session?.user);
  const emailOk = $derived(!!user?.email);
  const pending = $derived(players.filter((p) => p.status === 'pending'));
  const members = $derived(players.filter((p) => p.status === 'approved'));

  async function reload() {
    if (!profile.is_admin) return;
    try { players = await loadPlayers(); } catch (e) { error = humanError(e); }
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

  {#if profile.is_admin}
    {#if error}<p class="error" role="alert">{error}</p>{/if}

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
