# Juegos diarios — Plan y decisiones

App web (instalable en Android y Windows) para que un grupo de amigos juegue
a juegos diarios, registre sus resultados y compita en rankings.

## 1. Cómo se juega cada juego (comprobado el 7-nov-2026)

Se cargó cada web dentro de un iframe en Chrome real. Solo se comprobó que
cargan; la partida completa se validará en el móvil (fase 3).

| Juego | Resultado de la prueba | Modo |
|---|---|---|
| Poople, Noilirk, Fermi, Worldle, Globle, MapTap, TimeGuessr, Whenere | Cargan dentro | Dentro de la app (iframe) |
| Stranded | Carga, pero tiene inicio de sesión | Dentro; si se usa cuenta → navegador integrado |
| Krillion, Perceptle | Su cabecera `frame-ancestors 'self'` lo prohíbe | Navegador integrado |
| Travle, Flagle | Detectan el iframe y muestran aviso de "web no oficial" | Navegador integrado |
| Wordle Español | Desde fuera de España redirige al Wordle del NYT; desde España sale en español | Probar desde el móvil |

- **No** se usarán proxies para saltarse los bloqueos: respetamos la decisión de cada web.
- "Navegador integrado": en la app instalada en Android, el enlace se abre en una
  hoja superpuesta y se vuelve con un toque. En Windows se abre una ventana normal.
- Dentro de un iframe, el progreso que guarda el propio juego va separado del de su web.
- Cada juego tendrá un interruptor para cambiar de modo.

## 2. Reglas de la competición

- **Día:** hora de España (Europe/Madrid).
- **Ganador del día por juego:** el mejor resultado. Cada juego define si gana el número
  más alto o el más bajo. **Empate: ganan todos los empatados.**
- **Fallar** cuenta como el peor resultado posible. **No jugar** no puntúa ese día.
- Un resultado por juego y día. Solo se puede registrar el día en curso.

## 3. Usuarios y permisos

- Registro una vez: nombre + email. El dispositivo recuerda la sesión.
- Recuperar o añadir dispositivo: enlace por email (sin contraseñas).
- Quien se registra queda **pendiente** hasta que un admin lo aprueba.
- **Admins:** editan la lista de juegos, aprueban gente, corrigen o anulan resultados y
  pueden nombrar a otros admins. El primer admin es Borja.
- Datos guardados: solo nombre, email (para recuperar) y resultados.

## 4. Contra las trampas

No se pueden eliminar del todo (solo el servidor de cada juego sabe el resultado real).
Medidas:
1. El ranking y el chat de un juego permanecen ocultos hasta que registras tu resultado.
2. Texto de "Compartir" obligatorio donde exista; se valida el número de partida del día.
3. Sin edición propia: las correcciones las hace un admin y quedan marcadas.
4. Plazo: solo el día en curso.
5. El texto original queda visible y cualquiera puede reportar un resultado; un admin decide.

## 5. Registrar resultados (opción híbrida)

- **Pegar** el texto de Compartir: la app detecta el juego y extrae el valor.
- **Entrada rápida** a medida del juego cuando no hay texto de compartir.
- Android: compartir directamente a la app (Web Share Target).
- Los lectores de cada juego se construyen con **ejemplos reales** y tienen tests.

## 6. Pantallas

- **Hoy:** tus juegos pendientes y hechos, y quién va ganando cada juego.
- **Juego:** ranking del día, historial de posiciones y tus estadísticas
  (racha, media, evolución).
- **Palmarés:** victorias por juego y jugador, y una clasificación general.
- **Chat:** uno general del grupo y uno por juego (desbloqueado al jugar).
- **Ajustes:** cuenta, invitaciones y gestión de juegos (admins).

## 6b. Flujos detallados (18-nov-2026)

**Base de diseño:** el artifact "Juegos de hoy" de Borja (tarjetas de color por juego con
emoji, teclado de números para registrar, "Hecho, sin resultado", deshacer). Tipografía
Bricolage Grotesque, modo claro y oscuro.

### Flujo 1 · Entrar por primera vez
1. Un admin comparte el enlace de la app.
2. La persona escribe un nombre de usuario y su email → queda "pendiente de aprobación".
3. Los admins ven la solicitud y aprueban o rechazan.
4. Al aprobarla, entra. El dispositivo la recuerda para siempre.
5. Si pierde el móvil o entra desde otro dispositivo: "Entrar con mi email" → enlace al correo.

### Flujo 2 · Jugar y registrar
1. Abre la app → pantalla Hoy con tarjetas (pendientes arriba, hechos abajo).
2. Toca un juego → se abre (dentro de la app o en el navegador integrado).
   La app apunta la hora en que lo abrió.
3. Al volver, la app detecta que venías de ese juego y **abre sola la hoja de registro**.
4. Registro, de menos a más esfuerzo:
   - **Compartir del juego → elegir "Juegos diarios"** (Android): se registra solo.
   - Si el botón del juego copia el texto en el portapapeles: al volver, la app lo lee y
     solo tienes que confirmar (hay que comprobar en el móvil el permiso de Chrome).
   - **Teclado de números** como en el artifact (por ejemplo 1-5 y ✕, o un número libre).
5. Tras registrar se desbloquean el ranking de hoy y el chat de ese juego.

**"Leer la pantalla sola" no es posible:** el navegador prohíbe a una web leer lo que
muestra otra web (es una protección de seguridad). Las alternativas de arriba son lo más
cercano. Una captura de pantalla con lectura automática se deja como posible mejora futura
(más pasos y más errores que compartir el texto).

**"Asegurar que has jugado":**
- Las entradas con texto de Compartir llevan el sello "verificado" (con el número de
  partida de hoy).
- Las entradas manuales llevan la marca "manual".
- Se guarda el tiempo entre abrir el juego y registrar el resultado.
- Lo demás, según el apartado 4.

### Flujo 3 · Rankings
- **Diario:** por juego, quién quedó primero, segundo… hoy (empates comparten puesto).
- **Histórico:** por juego, la posición de cada jugador día a día.
- **Global:** victorias por juego y jugador, más una tabla general con el total de victorias.

### Flujo 4 · Chats
- **General del grupo** + **uno por juego** (visible tras jugar ese día).
- Mensajes automáticos de la app: "Ana ha registrado Worldle: 3/6", "Hoy gana Luis el Globle".

## 7. Arquitectura

- **Frontend:** Vite + Svelte, PWA instalable, modo claro y oscuro.
  Publicado en GitHub Pages (repositorio público).
- **Backend:** Supabase (Postgres + autenticación por email + tiempo real para el chat).
  Las reglas de seguridad van en la base de datos (Row Level Security). La clave
  pública de Supabase puede estar en el código; nunca la clave de servicio.
- Plan gratis: pocos emails por hora y pausa tras 7 días sin uso.

## 8. Fases (un commit al final de cada una)

0. ✅ Verificación de webs y plan (este documento)
1. Base: proyecto, PWA, Supabase, registro, aprobación, admins, publicación
2. Hoy + jugar (iframe / navegador integrado)
3. Registro de resultados (pegar + entrada rápida), con ejemplos reales
4. Rankings, palmarés y estadísticas
5. Chat
6. Pulido de diseño, animaciones y accesibilidad

## 9. Pendiente del usuario

- Textos reales de "Compartir" de cada juego (2-3 por juego, uno fallido) y capturas
  de los que no tengan botón de compartir.
- Crear la cuenta de Supabase (guiado en la fase 1).
