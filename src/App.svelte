<script>
  import { onMount } from 'svelte';
  import { supabase } from './lib/supabase.js';
  import { loadProfile, humanError } from './lib/account.js';
  import Welcome from './screens/Welcome.svelte';
  import Pending from './screens/Pending.svelte';
  import Today from './screens/Today.svelte';
  import Settings from './screens/Settings.svelte';

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
    <main class="page fade-in">
      <h1>Ranking</h1>
      <p class="lead">Llega en la fase 4: ranking del día, histórico y palmarés.</p>
    </main>
  {/if}
  <nav class="tabs" aria-label="Secciones">
    <div class="in">
      <button class="tab" aria-current={tab === 'hoy' ? 'page' : undefined} onclick={() => (tab = 'hoy')}><span class="ico" aria-hidden="true">🎲</span>Hoy</button>
      <button class="tab" aria-current={tab === 'ranking' ? 'page' : undefined} onclick={() => (tab = 'ranking')}><span class="ico" aria-hidden="true">🏆</span>Ranking</button>
      <button class="tab" aria-current={tab === 'ajustes' ? 'page' : undefined} onclick={() => (tab = 'ajustes')}><span class="ico" aria-hidden="true">⚙️</span>Ajustes</button>
    </div>
  </nav>
{/if}
