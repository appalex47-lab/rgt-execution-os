/**
 * Cohere Structured Outputs compatibility layer.
 *
 * This module only validates/sanitizes the wire schema sent to Cohere.
 * Functional/domain validation remains in the RGT validators.
 */

const UNSUPPORTED_KEYS = new Set([
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
  "minItems", "maxItems", "minLength", "maxLength"
]);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function sanitizeNode(node, path = "$", seen = new WeakSet()) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return clone(node);
  if (seen.has(node)) throw new Error(`Schema Cohere inválido: referencia circular en ${path}.`);
  seen.add(node);

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (UNSUPPORTED_KEYS.has(key)) continue;
    if (key === "type" && Array.isArray(value)) {
      // Cohere accepts anyOf, while type:[...] is rejected by Structured Outputs.
      out.anyOf = value.map((type, i) => sanitizeNode({type}, `${path}.anyOf[${i}]`, seen));
      continue;
    }
    if (key === "properties" && value && typeof value === "object" && !Array.isArray(value)) {
      out.properties = Object.fromEntries(
        Object.entries(value).map(([name, child]) => [name, sanitizeNode(child, `${path}.properties.${name}`, seen)])
      );
      continue;
    }
    if (key === "items") {
      out.items = sanitizeNode(value, `${path}.items`, seen);
      continue;
    }
    if (key === "anyOf") {
      if (!Array.isArray(value)) throw new Error(`Schema Cohere inválido: anyOf debe ser array en ${path}.`);
      out.anyOf = value.map((child, i) => sanitizeNode(child, `${path}.anyOf[${i}]`, seen));
      continue;
    }
    out[key] = clone(value);
  }
  seen.delete(node);
  return out;
}

function validateNode(node, path = "$", isTopLevel = false) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    throw new Error(`Schema Cohere inválido en ${path}: debe ser un objeto de schema.`);
  }

  if (isTopLevel && node.type !== "object") {
    throw new Error(`Schema Cohere inválido: el top-level debe ser type=object (en ${path}).`);
  }

  if (node.type === "object") {
    if (!node.properties || typeof node.properties !== "object" || Array.isArray(node.properties)) {
      throw new Error(`Schema Cohere inválido en ${path}: object requiere properties.`);
    }
    if (!Array.isArray(node.required) || node.required.length === 0) {
      throw new Error(`Schema Cohere inválido en ${path}: todo object requiere al menos un campo required.`);
    }
    for (const key of node.required) {
      if (!Object.prototype.hasOwnProperty.call(node.properties, key)) {
        throw new Error(`Schema Cohere inválido en ${path}: required '${key}' no existe en properties.`);
      }
    }
    for (const [key, child] of Object.entries(node.properties)) validateNode(child, `${path}.properties.${key}`);
  }

  if (node.type === "array" && node.items) validateNode(node.items, `${path}.items`);
  if (Array.isArray(node.anyOf)) node.anyOf.forEach((child, i) => validateNode(child, `${path}.anyOf[${i}]`));
}

export function toCohereSchema(schema) {
  const wire = sanitizeNode(schema);
  validateNode(wire, "$", true);
  return wire;
}

export function assertCohereSchemaCompatible(schema) {
  toCohereSchema(schema);
  return true;
}
