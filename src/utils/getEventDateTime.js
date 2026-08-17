/**
 * Combina el campo `date` de un Event (siempre anclado a medianoche UTC
 * del día calendario) con su campo `time` (string "HH:mm") para obtener
 * el instante real en el que ocurre la actividad, en hora local del
 * servidor.
 *
 * Como el servidor corre en America/Costa_Rica (mismo huso horario real
 * de los usuarios), el constructor LOCAL de Date sí representa el
 * instante que el organizador quiso decir.
 *
 * Misma lógica ya validada en el validador isNotPastDate de Event.js.
 */
export function getEventDateTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );
}
