<script>
  // Dado 3D (caras 1, 3 y 6): el icono de "jugar" en toda la app.
  let { size = 28 } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,.25)); flex: none;">
  <path d="M12 2.2 21.6 7 12 11.8 2.4 7z" fill="#FFFFFF"/>
  <path d="M2.4 7 12 11.8v10L2.4 17z" fill="#E7E1D6"/>
  <path d="M21.6 7 12 11.8v10l9.6-4.8z" fill="#CFC7B8"/>
  <g fill="#23201C">
    <ellipse cx="12" cy="7" rx="1.5" ry=".9"/>
    <circle cx="4.9" cy="10.6" r="1.05"/><circle cx="7.2" cy="14.3" r="1.05"/><circle cx="9.5" cy="18" r="1.05"/>
    <circle cx="15.2" cy="12.4" r="1"/><circle cx="18.6" cy="10.7" r="1"/>
    <circle cx="15.2" cy="15.6" r="1"/><circle cx="18.6" cy="13.9" r="1"/>
    <circle cx="15.2" cy="18.8" r="1"/><circle cx="18.6" cy="17.1" r="1"/>
  </g>
</svg>
