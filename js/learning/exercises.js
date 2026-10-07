import {getActiveSprint} from "../engines/sprintEngine.js";
import {getMustWinIds, PILLARS} from "../engines/mustWinEngine.js";
import {getTransformWip, WIP_LIMIT} from "../engines/wipEngine.js";
import {getExecutionHealth} from "../engines/executionHealthEngine.js";
import {getNextAction} from "../engines/nextActionEngine.js";
import {buildMyTasks} from "../engines/tasksEngine.js";
import {buildFollowUp} from "../engines/followUpEngine.js";

/**
 * Exercises for the Master Route. Each one is a question about WHAT THE LEARNER IS LOOKING AT,
 * computed from the same engines the screens use (never a second copy of a rule), so the answer
 * changes with the user's real data. The builder is deterministic: the same snapshot always yields
 * the same options in the same order, so validation can simply rebuild it.
 *
 * build(id, snapshot) → {id, prompt, options:[{id,text}], correct, hint, explain}
 */
const HEALTH = {STABLE: "Estable", ATTENTION: "Atención", AT_RISK: "Riesgo operativo"};
const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const uniq = a => [...new Set(a.filter(x => x != null && String(x).trim() !== ""))];

/** Correct answer + distractors → stable option list (correct is placed by a hash of the exercise id). */
function make(id, {prompt, correct, wrong, hint, explain}) {
  const bad = uniq(wrong).filter(x => x !== correct).slice(0, 3);
  const texts = [...bad];
  texts.splice(hash(id) % (bad.length + 1), 0, correct);
  const options = texts.map((text, i) => ({id: `o${i}`, text}));
  return {id, prompt, options, correct: options.find(o => o.text === correct).id, hint, explain};
}

const BUILDERS = {
  "cc-next-step": d => {
    const na = getNextAction(d);
    return make("cc-next-step", {
      prompt: "Mira la tarjeta «Siguiente paso». ¿Qué te recomienda hacer RGT ahora mismo?",
      correct: na.title,
      wrong: ["Crear una iniciativa nueva", "Cambiar los límites de WIP", "Exportar un backup", "Cerrar la semana: el Sprint ya venció", "Elegir tus Must-Win"].filter(x => x !== na.title),
      hint: "No lo adivines: la respuesta está escrita en la tarjeta azul «Siguiente paso» del Command Center.",
      explain: `Correcto. RGT lo propone porque: ${na.why} Decidir qué hacer ahora es lo más caro de la ejecución; por eso se muestra un solo paso.`
    });
  },
  "planning-sprint": d => {
    const s = getActiveSprint(d.sprints) || d.sprints?.[0];
    if (!s) return make("planning-sprint", {prompt: "¿Qué necesitas antes de planear una semana en RGT?", correct: "Un Sprint ACTIVE con fechas", wrong: ["Un forecast comercial", "Tres iniciativas DONE", "Una lección dominada"], hint: "Todo el ciclo semanal cuelga del Sprint.", explain: "El Sprint define las fechas y es la base del Must-Win y de la revisión."});
    const w = Number(s.week_number), label = (week, a, b) => `Semana ${week} · ${a} → ${b}`;
    return make("planning-sprint", {
      prompt: "Mira el Sprint de esta pantalla. ¿Qué semana y qué fechas tiene tu Sprint activo?",
      correct: label(w, s.start_date, s.end_date),
      wrong: [label(w + 1, s.end_date, s.end_date), label(w - 1, s.start_date, s.start_date), label(w, s.end_date, s.start_date)],
      hint: "Busca la semana y el rango de fechas en el Sprint de Planning Semanal (también aparece en la barra lateral).",
      explain: "El Sprint es el contenedor de la semana: sus fechas deciden cuándo toca revisar y qué se considera atrasado."
    });
  },
  "board-wip": d => {
    const wip = getTransformWip(d.initiatives || []), room = wip < WIP_LIMIT;
    return make("board-wip", {
      prompt: `El Board muestra TRANSFORM WIP ${wip}/${WIP_LIMIT}. ¿Puedes iniciar ahora otra iniciativa TRANSFORM?`,
      correct: room ? `Sí: hay capacidad (${wip}/${WIP_LIMIT})` : `No: el WIP está lleno (${wip}/${WIP_LIMIT}); primero termina o libera una`,
      wrong: room
        ? [`No: el WIP está lleno (${wip}/${WIP_LIMIT}); primero termina o libera una`, "No, TRANSFORM siempre exige aprobación", "Solo si la marcas como BLOCKED"]
        : [`Sí: hay capacidad (${wip}/${WIP_LIMIT})`, "Sí, si pongo la nueva como BLOCKED (BLOCKED no cuenta)", "Sí, el límite es solo una sugerencia"],
      hint: `El límite es ${WIP_LIMIT}. Ojo: una iniciativa BLOCKED también consume WIP.`,
      explain: "El WIP protege el foco: la entrada al trabajo se limita para terminar antes de empezar. BLOCKED sigue ocupando un lugar."
    });
  },
  "must-win-pillars": d => {
    const s = getActiveSprint(d.sprints) || d.sprints?.[0], items = d.initiatives || [];
    const picked = s ? getMustWinIds(s, items).map(id => items.find(x => x.id === id)).filter(Boolean) : [];
    const missing = PILLARS.filter(p => !picked.some(x => x.pillar === p));
    if (missing.length) return make("must-win-pillars", {
      prompt: `Tu Must-Win de la semana no está completo. ¿Qué pilar te falta?`, correct: missing[0],
      wrong: PILLARS.filter(p => p !== missing[0]), hint: "Mira las tres tarjetas RUN / GROW / TRANSFORM: busca la que dice «Sin definir».",
      explain: "Guardar Must-Win exige uno por pilar; sin los tres, el Sprint no tiene una apuesta equilibrada."
    });
    return make("must-win-pillars", {
      prompt: "Tus tres Must-Win ya están definidos. ¿Qué combinación exige RGT?", correct: "1 RUN + 1 GROW + 1 TRANSFORM",
      wrong: ["3 TRANSFORM", "2 RUN + 1 GROW", "Las que yo quiera, hasta 5"],
      hint: "Son tres batallas, una por pilar.", explain: "Una por pilar mantiene el equilibrio entre sostener (RUN), crecer (GROW) y transformar (TRANSFORM)."
    });
  },
  "tasks-first": d => {
    const rows = buildMyTasks(d), first = rows[0]?.initiative;
    if (!first) return make("tasks-first", {prompt: "No tienes tareas accionables. ¿Qué estados cuentan como accionables en Mis tareas?", correct: "READY, IN_PROGRESS y BLOCKED", wrong: ["BACKLOG y DONE", "Solo DONE", "Cualquier estado"], hint: "Lo accionable es lo que ya puedes empezar, estás haciendo o está atorado.", explain: "BACKLOG todavía no está listo y DONE ya terminó."});
    const label = x => `${x.id} · ${x.title}`;
    return make("tasks-first", {
      prompt: "Mis tareas ordena por urgencia (bloqueadas y Must-Win primero). ¿Cuál es la PRIMERA tarea de tu lista?",
      correct: label(first), wrong: (d.initiatives || []).filter(x => x.id !== first.id).map(label),
      hint: "Mira la primera fila de la lista de Mis tareas.",
      explain: first.status === "BLOCKED" ? "Va primero porque está bloqueada: lo atorado requiere decisión antes que avanzar lo demás." : "Va primero por su prioridad: Must-Win y bloqueadas pesan más."
    });
  },
  "deepwork-minutes": () => make("deepwork-minutes", {
    prompt: "¿Cuánto dura un bloque de Deep Work en RGT?", correct: "120 minutos",
    wrong: ["25 minutos", "45 minutos", "240 minutos"], hint: "Es un bloque largo, pensado para trabajo que exige concentración sostenida.",
    explain: "Bloques de 120 minutos: suficientes para avanzar algo importante sin interrupciones."
  }),
  "followup-blocked": d => {
    const n = buildFollowUp(d).blocked.length;
    return make("followup-blocked", {
      prompt: "Seguimiento detecta lo atorado. ¿Cuántas iniciativas bloqueadas ves en esta pantalla?", correct: String(n),
      wrong: [String(n + 1), String(n + 2), String(Math.max(0, n - 1)), String(n + 3)],
      hint: "Cuenta las iniciativas de la sección de bloqueadas.",
      explain: n ? "Cada bloqueo es una decisión pendiente; y recuerda que BLOCKED sigue consumiendo WIP." : "Sin bloqueos: bien. Aun así revisa lo próximo y lo que lleva días sin moverse."
    });
  },
  "weekly-done": d => {
    const s = getActiveSprint(d.sprints) || d.sprints?.[0], items = d.initiatives || [];
    const ids = s ? getMustWinIds(s, items) : [], done = ids.filter(id => items.find(x => x.id === id)?.status === "DONE").length, total = ids.length || 3;
    return make("weekly-done", {
      prompt: "Para cerrar la semana primero miras los hechos. ¿Cuántos Must-Win están DONE en este Sprint?", correct: `${done} de ${total}`,
      wrong: [`${Math.min(total, done + 1)} de ${total}`, `${Math.max(0, done - 1)} de ${total}`, `${total} de ${total}`, `0 de ${total}`],
      hint: "El resumen por pilar de la Weekly Review (o la tarjeta Must-Win del Command Center) lo dice.",
      explain: "Los Must-Win no terminados no se «arrastran» solos: en la revisión decides si continúan o se cierran de forma explícita."
    });
  },
  "health-status": d => {
    const h = getExecutionHealth(d);
    return make("health-status", {
      prompt: "Execution Health resume la salud operativa. ¿En qué estado está tu ejecución ahora?", correct: HEALTH[h.status] || String(h.status),
      wrong: Object.values(HEALTH), hint: "Léelo en la tarjeta principal de la pantalla (también aparece en el Command Center).",
      explain: "La salud se calcula con reglas deterministas (bloqueos, DoD, WIP, Must-Win): es una señal para decidir, no un juicio."
    });
  },
  "performance-scope": () => make("performance-scope", {
    prompt: "Performance en RGT, ¿qué mide?", correct: "Rendimiento de ejecución (no forecast ni pacing comercial)",
    wrong: ["Ventas proyectadas del mes", "Pacing de ingresos contra la meta", "Recuperación comercial esperada"],
    hint: "RGT es el sistema de ejecución. Lo comercial tiene otra fuente de verdad.",
    explain: "RGT mide cómo se ejecuta; el forecast, pacing y recuperación pertenecen a RevNavigator."
  }),
  "history-purpose": () => make("history-purpose", {
    prompt: "¿Para qué sirve el Historial?", correct: "Trazabilidad: qué cambió, cuándo y por qué",
    wrong: ["Para deshacer cualquier cambio automáticamente", "Para planear la próxima semana", "Para conectar la IA"],
    hint: "Piensa en una bitácora de cambios, no en una máquina de deshacer.",
    explain: "Con trazabilidad puedes reconstruir lo ocurrido con hechos en la Weekly Review."
  }),
  "academy-retry": () => make("academy-retry", {
    prompt: "En la Academy fallas una pregunta de una lección. ¿Qué pasa?", correct: "Se registra el refuerzo de ese concepto y puedes reintentar",
    wrong: ["La lección se marca como dominada igual", "Pierdes todo tu progreso", "La lección se bloquea para siempre"],
    hint: "Piensa en aprendizaje adaptativo: el error orienta el siguiente refuerzo.", explain: "RGT guarda tu dominio por concepto y te recomienda reforzar lo más débil; nunca te penaliza."
  }),
  "assistant-authority": () => make("assistant-authority", {
    prompt: "Si el RGT Assistant te propone un cambio, ¿quién tiene la última palabra?", correct: "Tú: confirmas, y RGT valida las reglas antes de aplicar",
    wrong: ["El Assistant aplica solo lo que propone", "La IA puede saltarse el WIP si lo justifica", "Nadie: se aplica al cerrar la semana"],
    hint: "La IA propone; no ejecuta ni cambia reglas.", explain: "RGT conserva la autoridad sobre las reglas (WIP, Ready, DoD) y toda acción necesita tu confirmación."
  })
};

export const EXERCISE_IDS = Object.freeze(Object.keys(BUILDERS));
export function buildExercise(id, snapshot = {}) {
  const b = BUILDERS[id];
  if (!b) return null;
  return b({sprints: [], initiatives: [], checklist: [], activity: [], reviews: [], ...snapshot});
}
