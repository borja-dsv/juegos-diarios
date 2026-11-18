<script>
  import { onMount } from 'svelte';

  let { profile, rejected = false, onCheck } = $props();

  // Comprueba solo cada 20 segundos si ya te han aprobado.
  onMount(() => {
    if (rejected) return;
    const t = setInterval(onCheck, 20000);
    return () => clearInterval(t);
  });
</script>

<main class="page fade-in">
  <div class="brand"><img src="{import.meta.env.BASE_URL}icon-192.png" alt="" width="40" height="40" /><span>Hola, {profile.username}</span></div>
  {#if rejected}
    <h1>Solicitud no aprobada</h1>
    <p class="lead">Un admin ha rechazado tu solicitud. Si crees que es un error, habla con quien te pasó el enlace.</p>
  {:else}
    <h1>Esperando aprobación</h1>
    <p class="lead">Un admin del grupo tiene que aceptarte. En cuanto lo haga, entrarás directamente: no tienes que hacer nada más.</p>
    <div class="note">Mientras tanto, revisa tu email: te hemos enviado un enlace para confirmarlo. Así podrás recuperar tu cuenta si cambias de móvil.</div>
    <button class="btn quiet" onclick={onCheck}>Comprobar ahora</button>
  {/if}
</main>
