/** Casos Prácticos: entry point and structure only (content arrives in later phases). */
export function cases() {
  const step = (n, t, d) => `<li><b>${n}. ${t}</b><span>${d}</span></li>`;
  return `<div class=head><div><div class=eyebrow>Aprender</div><h1>Casos Prácticos</h1><div class=sub>Ejercicios de decisión sobre situaciones reales de ejecución.</div></div><span class=status>Próximamente</span></div>
  <section class=panel data-rgt-target="cases-flow"><h2>Cómo funcionará cada caso</h2><ol class="case-flow">${step(1, "Caso", "Una situación realista de tu operación.")}${step(2, "Decisión", "Eliges qué harías.")}${step(3, "Respuesta", "RGT valida tu decisión con sus reglas.")}${step(4, "Explicación", "Por qué era (o no) la mejor opción.")}${step(5, "Aplicación en RGT", "Llevas la decisión a la herramienta.")}</ol></section>
  <div class=callout>Aún no hay casos disponibles. Mientras tanto, practica en <a href="#/execution/aprender/rutas">Ruta Guiada</a>.</div>`;
}
