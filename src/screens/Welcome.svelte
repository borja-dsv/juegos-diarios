<script>
  import { register, sendLoginLink, humanError, USERNAME_RE, EMAIL_RE } from '../lib/account.js';

  let { onDone } = $props();

  let mode = $state('register'); // register | login | sent
  let username = $state('');
  let email = $state('');
  let busy = $state(false);
  let error = $state('');

  const validUser = $derived(USERNAME_RE.test(username.trim()));
  const validEmail = $derived(EMAIL_RE.test(email.trim()));

  async function run(fn) {
    busy = true; error = '';
    try { await fn(); } catch (e) { error = humanError(e); } finally { busy = false; }
  }

  const doRegister = () => run(async () => {
    await register(username.trim(), email.trim().toLowerCase());
    onDone();
  });
  const doSendLink = () => run(async () => {
    await sendLoginLink(email.trim().toLowerCase());
    mode = 'sent';
  });
</script>

<main class="page fade-in">
  <div class="brand"><img src="{import.meta.env.BASE_URL}icon.svg" alt="" width="40" height="40" /><span>Juegos diarios</span></div>

  {#if mode === 'register'}
    <h1>Únete al grupo</h1>
    <p class="lead">Elige tu nombre de jugador. Solo se hace una vez: este dispositivo te recordará.</p>
    <form onsubmit={(e) => { e.preventDefault(); if (validUser && validEmail) doRegister(); }}>
      <label class="field"><span>Nombre de jugador</span>
        <input bind:value={username} autocomplete="nickname" maxlength="20" placeholder="Por ejemplo: borja" />
      </label>
      {#if username && !validUser}<p class="error">De 2 a 20 letras o números, sin espacios.</p>{/if}
      <label class="field"><span>Email (solo para recuperar tu cuenta, nadie más lo ve)</span>
        <input bind:value={email} type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com" />
      </label>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button class="btn primary block" disabled={busy || !validUser || !validEmail}>{busy ? 'Creando…' : 'Entrar'}</button>
    </form>
    <p class="small muted">¿Ya tenías cuenta en otro dispositivo? <button class="link" onclick={() => { mode = 'login'; error = ''; }}>Recupérala con tu email</button></p>

  {:else if mode === 'login'}
    <h1>Recupera tu cuenta</h1>
    <p class="lead">Te enviaremos un enlace a tu email. Ábrelo en este dispositivo y entrarás.</p>
    <form onsubmit={(e) => { e.preventDefault(); if (validEmail) doSendLink(); }}>
      <label class="field"><span>Email</span>
        <input bind:value={email} type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com" />
      </label>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button class="btn primary block" disabled={busy || !validEmail}>{busy ? 'Enviando…' : 'Enviar enlace'}</button>
    </form>
    <button class="link" onclick={() => { mode = 'register'; error = ''; }}>Volver</button>

  {:else}
    <h1>Mira tu email</h1>
    <p class="lead">Te hemos enviado un enlace a <b>{email}</b>. Ábrelo en este mismo dispositivo para entrar.</p>
    <div class="note">El email llega en inglés, con el asunto <b>«Your sign-in link»</b>. Pulsa <b>«Sign in»</b>. Si no lo ves, mira en spam.</div>
    <button class="link" onclick={() => { mode = 'login'; error = ''; }}>Enviar otro enlace</button>
  {/if}
</main>
