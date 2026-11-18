<script>
  // Pantalla completa con el juego DENTRO de la app (iframe), o, si la web del juego
  // no lo permite, un botón para abrirlo en el navegador integrado del sistema.
  import DiceIcon from './DiceIcon.svelte';
  let { game, done = false, onExit, onRecord } = $props();
</script>

<div class="player" role="dialog" aria-modal="true" aria-label={game.name}>
  <header>
    <button class="btn quiet sm" onclick={onExit} aria-label="Volver a Hoy">← Salir</button>
    <span class="title"><span aria-hidden="true">{game.emoji}</span> {game.name}</span>
    {#if done}<span class="done">✓ Hecho</span>{:else}<button class="btn go sm" onclick={onRecord}>Apuntar</button>{/if}
  </header>
  {#if game.open_mode === 'embed'}
    <iframe src={game.url} title={game.name} allow="clipboard-read; clipboard-write; web-share; fullscreen; autoplay"></iframe>
  {:else}
    <div class="external">
      <span class="big" aria-hidden="true">{game.emoji}</span>
      <h2>{game.name} no se deja abrir dentro de otras apps</h2>
      <p class="lead">Se abrirá encima de la app. Cuando termines, ciérralo con la ✕ y vuelve aquí: te pediremos el resultado.</p>
      <a class="btn primary block" href={game.url} target="_blank" rel="noopener"><DiceIcon size={24} />Jugar a {game.name}</a>
    </div>
  {/if}
</div>

<style>
  .player { position: fixed; inset: 0; z-index: 30; background: var(--bg); display: flex; flex-direction: column; padding-top: env(safe-area-inset-top, 0px); }
  header { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--line); background: var(--surface); }
  .title { flex: 1; min-width: 0; text-align: center; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .done { flex: none; font-size: 14px; font-weight: 650; color: var(--done); padding: 0 10px; }
  iframe { flex: 1; width: 100%; border: 0; background: #fff; }
  .external { max-width: 480px; margin: 0 auto; padding: 40px 20px; text-align: center; }
  .big { font-size: 56px; }
  .external h2 { margin-top: 12px; }
</style>
