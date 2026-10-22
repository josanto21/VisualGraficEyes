const kinds = new Set(['ILUSTRACIÓN', 'SIMULACIÓN']);
export function createModelBadge(model, dom = document) {
  if (!kinds.has(model?.kind)) throw new Error('model.kind: se requiere ILUSTRACIÓN o SIMULACIÓN');
  const badge = dom.createElement('span'); badge.className = 'model-badge'; badge.dataset.modelKind = model.kind; badge.textContent = model.kind;
  return badge;
}
export function showError(host, error, onOpen = null) {
  const dom = host.ownerDocument;
  const panel = dom.createElement('section'); panel.className = 'error-panel'; panel.setAttribute('role', 'alert');
  const title = dom.createElement('h1'); title.textContent = 'No se pudo abrir el visual';
  const message = dom.createElement('p'); message.textContent = 'Revisa el archivo y vuelve a intentarlo. El motivo aparece abajo.';
  const detail = dom.createElement('pre'); detail.className = 'error-detail'; detail.textContent = error?.message ?? String(error); panel.append(title, message, detail);
  if (onOpen) { const button = dom.createElement('button'); button.type = 'button'; button.textContent = 'Abrir otro JSON'; button.addEventListener('click', onOpen); panel.append(button); }
  host.replaceChildren(panel);
}
