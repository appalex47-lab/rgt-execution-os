// Minimal DOM stub so the legacy browser-style suites (which write results to document.body) run under Node.
globalThis.document = {body: {innerHTML: ""}};
globalThis.window = globalThis;
