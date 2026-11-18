<script>
  import { onMount } from 'svelte';
  import { supabase } from './lib/supabase.js';
  import { loadProfile, humanError } from './lib/account.js';
  import Welcome from './screens/Welcome.svelte';
  import Pending from './screens/Pending.svelte';
  import Today from './screens/Today.svelte';
  import Settings from './screens/Settings.svelte';
  import Ranking from './screens/Ranking.svelte';

  // Qué pantalla toca: loading | welcome | pending | rejected | app | error
  let status = $state('loading');
  let session = $state(null);
  let profile = $state(null);
  let tab = $state('hoy');
  let errorMsg = $state('');

  async function refresh() {
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
      profile = session ? await loadProfile(session.user.id) : null;
      if (!profile) status = 'welcome';
      else status = profile.status === 'approved' ? 'app' : profile.status;
    } catch (e) {
      errorMsg = humanError(e);
      status = 'error';
    }
  }

  onMount(() => {
    refresh();
    // No se puede llamar a Supabase dentro de este aviso directamente: se aplaza un instante.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) setTimeout(refresh, 0);
    });
    return () => data.subscription.unsubscribe();
  });
</script>

{#if status === 'loading'}
  <main class="page"><p class="muted">Cargando…</p></main>
{:else if status === 'error'}
  <main class="page">
    <h1>Vaya</h1>
    <p class="lead">{errorMsg}</p>
    <button class="btn primary" onclick={refresh}>Reintentar</button>
  </main>
{:else if status === 'welcome'}
  <Welcome onDone={refresh} />
{:else if status === 'pending' || status === 'rejected'}
  <Pending {profile} rejected={status === 'rejected'} onCheck={refresh} />
{:else}
  {#if tab === 'hoy'}
    <Today {profile} />
  {:else if tab === 'ajustes'}
    <Settings {profile} {session} />
  {:else}
    <Ranking {profile} />
  {/if}
  <nav class="tabs" aria-label="Secciones">
    <div class="in">
      <button class="tab" aria-current={tab === 'hoy' ? 'page' : undefined} onclick={() => (tab = 'hoy')}><svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"></rect><rect x="14" y="3" width="7" height="7" rx="2"></rect><rect x="3" y="14" width="7" height="7" rx="2"></rect><rect x="14" y="14" width="7" height="7" rx="2"></rect></svg>Hoy</button>
      <button class="tab" aria-current={tab === 'ranking' ? 'page' : undefined} onclick={() => (tab = 'ranking')}><svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"></path><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"></path></svg>Ranking</button>
      <button class="tab" aria-current={tab === 'ajustes' ? 'page' : undefined} onclick={() => (tab = 'ajustes')}><svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"></path><circle cx="16" cy="6" r="2"></circle><circle cx="10" cy="12" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg>Ajustes</button>
    </div>
  </nav>
{/if}
