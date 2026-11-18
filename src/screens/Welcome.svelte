<script>
  import { register, sendLoginCode, verifyLoginCode, humanError, USERNAME_RE, EMAIL_RE } from '../lib/account.js';

  let { onDone } = $props();

  let mode = $state('register'); // register | login | code
  let username = $state('');
  let email = $state('');
  let code = $state('');
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
  const doSendCode = () => run(async () => {
    await sendLoginCode(email.trim().toLowerCase());
    mode = 'code';
  });
  const doVerify = () => run(async () => {
    await verifyLoginCode(email.trim().toLowerCase(), code.trim());
    onDone();
  });
</script>

<main class="page fade-in">
  <p class="muted" style="margin:24px 0 0">Juegos diarios</p>

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
    <p class="lead">Te enviaremos un código de 6 cifras a tu email.</p>
    <form onsubmit={(e) => { e.preventDefault(); if (validEmail) doSendCode(); }}>
      <label class="field"><span>Email</span>
        <input bind:value={email} type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com" />
      </label>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button class="btn primary block" disabled={busy || !validEmail}>{busy ? 'Enviando…' : 'Enviar código'}</button>
    </form>
    <button class="link" onclick={() => { mode = 'register'; error = ''; }}>Volver</button>

  {:else}
    <h1>Mira tu email</h1>
    <p class="lead">Escribe el código que te hemos enviado a <b>{email}</b>.</p>
    <form onsubmit={(e) => { e.preventDefault(); doVerify(); }}>
      <label class="field"><span>Código</span>
        <input bind:value={code} inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456" />
      </label>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button class="btn primary block" disabled={busy || code.trim().length < 6}>{busy ? 'Comprobando…' : 'Entrar'}</button>
    </form>
    <button class="link" onclick={() => { mode = 'login'; code = ''; error = ''; }}>Enviar otro código</button>
  {/if}
</main>
