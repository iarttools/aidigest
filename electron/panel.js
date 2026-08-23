(() => {
  const copy = {
    es: {
      'title': 'aidigest · runtime', 'brand.tagline': 'context runtime', 'workspace.local': 'ESPACIO LOCAL',
      'nav.workspace': 'WORKSPACE', 'nav.overview': 'Resumen', 'nav.activity': 'Actividad', 'nav.security': 'Seguridad',
      'sidebar.runtime': 'RUNTIME', 'sidebar.ledger': 'Ledger local', 'sidebar.proxy': 'Proxy del agente', 'sidebar.agentMode': 'Modo del agente',
      'language.label': 'IDIOMA', 'actions.clearHistory': 'Vaciar historial', 'actions.trustCenter': 'Centro de confianza', 'actions.shareProof': 'Compartir prueba', 'actions.dismiss': 'Ahora no', 'actions.copyConfig': 'Copiar configuración', 'actions.copyProof': 'Copiar prueba', 'actions.download': 'Descargar JSON', 'actions.close': 'Cerrar', 'status.live': 'LIVE', 'status.synced': 'SINCRONIZADO', 'status.updating': 'Actualizando…', 'status.updated': 'Actualizado {time}',
      'hero.eyebrow': 'LIVE CONTEXT RUNTIME', 'hero.titleA': 'Todo lo que tu agente', 'hero.titleB': 'no tuvo que leer.', 'hero.subtitle': 'Un runtime local que elimina ruido, protege el contexto y mide cada token antes de que llegue al modelo.',
      'metrics.savedTokens': 'Tokens ahorrados', 'metrics.savedTokensFoot': 'Contexto eliminado del flujo', 'metrics.reduction': 'Reducción media', 'metrics.reductionFoot': 'Sobre el total procesado', 'metrics.reads': 'Lecturas procesadas', 'metrics.readsFoot': 'Sesiones en el ledger', 'metrics.savings': 'Ahorro estimado', 'metrics.quality': 'Calidad media', 'metrics.qualityFoot': 'Trazabilidad y estructura', 'metrics.cache': 'Cache hit', 'metrics.cacheFoot': 'Reutilización inteligente',
      'chart.kicker': 'VOLUMEN DE CONTEXTO', 'chart.title': 'Compresión en tiempo real', 'chart.before': 'Antes', 'chart.after': 'Después', 'chart.empty': 'Esperando la primera lectura…', 'chart.range': 'Últimas 50 lecturas', 'chart.raw': 'HTML bruto', 'chart.digest': 'Digest seguro', 'chart.oldest': 'más antiguo', 'chart.now': 'ahora',
      'efficiency.kicker': 'EFICIENCIA', 'efficiency.title': 'Rendimiento del digest', 'efficiency.lessContext': 'menos contexto', 'efficiency.sent': 'tokens enviados', 'efficiency.rawTokens': 'de {count} tokens brutos', 'efficiency.distribution': 'Distribución por modo', 'efficiency.reads': 'lecturas',
      'activity.kicker': 'STREAM DE EVENTOS', 'activity.title': 'Últimas lecturas', 'activity.eventsOne': '{count} evento', 'activity.eventsMany': '{count} eventos', 'activity.emptyShort': 'Sin actividad todavía', 'activity.empty': 'Sin lecturas todavía. Cuando el agente consulte una web, aparecerá aquí.', 'activity.reviewed': 'Revisado', 'activity.safe': 'Seguro',
      'table.time': 'Hora', 'table.source': 'Fuente', 'table.url': 'URL', 'table.before': 'Antes', 'table.after': 'Después', 'table.reduction': 'Reducción', 'table.status': 'Estado',
      'security.kicker': 'PROTECCIÓN DE CONTEXTO', 'security.title': 'Seguridad del contexto', 'security.detected': 'inyecciones detectadas', 'security.clean': 'El scrubber está activo y analizando cada digest antes de entregarlo.', 'security.attemptOne': '{count} intento detectado y retirado antes de entregar contexto.', 'security.attemptMany': '{count} intentos detectados y retirados antes de entregar contexto.', 'security.injection': 'Prompt injection', 'security.budgets': 'Límites de presupuesto', 'security.ledger': 'Ledger atómico', 'security.sensitive': 'Datos sensibles: ', 'security.redactions': ' redacciones',
      'controls.proxyKicker': 'PUENTE DE RED', 'controls.proxyTitle': 'Puente del agente', 'controls.proxyOff': 'Activa el proxy local para entregar digests automáticamente.', 'controls.proxyOn': 'El agente puede enviar sus URLs al puente local.', 'controls.proxyEnable': 'Activar proxy', 'controls.proxyDisable': 'Desactivar proxy',
      'controls.modeKicker': 'POLÍTICA DEL AGENTE', 'controls.modeTitle': 'Modo del agente', 'controls.modeManual': 'El agente usa aidigest solo cuando se lo indicas.', 'controls.modeAuto': 'Las lecturas del agente pasan por aidigest por defecto.', 'controls.modeCode': 'automatic ↔ manual', 'controls.modeEnable': 'Activar automático', 'controls.modeDisable': 'Pasar a manual', 'controls.agentKicker': 'CONFIGURAR AGENTE', 'controls.agentTitle': 'Conectar un agente', 'controls.agentHint': 'Detecta clientes MCP y prepara la configuración en un paso.', 'controls.agentCode': 'Claude · Cursor · OpenCode', 'controls.agentButton': 'Configurar',
      'controls.gpuKicker': 'PRUEBA DE HARDWARE', 'controls.gpuTitle': 'Aceleración gráfica', 'controls.gpuChecking': 'Comprobando WebGPU y el dispositivo disponible…', 'controls.gpuDetails': 'fallback CPU preparado',
      'mode.auto': 'AUTO', 'mode.manual': 'MANUAL', 'proxy.on': 'ON', 'proxy.off': 'OFF', 'gpu.check': 'CHECK', 'gpu.cpu': 'CPU', 'gpu.webgpu': 'WEBGPU', 'gpu.noApi': 'WebGPU no está disponible; el panel mantiene un fallback estable.', 'gpu.noAdapter': 'No se encontró un adaptador compatible; se mantiene el fallback seguro.', 'gpu.detected': 'GPU disponible y verificada con un compute probe local.', 'gpu.fallbackDetails': 'Fallback CPU preparado', 'gpu.noAdapterDetails': 'Sin adaptador WebGPU',
      'toast.historyCleared': 'Historial vaciado', 'toast.proxyOn': 'Proxy activo en 127.0.0.1:8080', 'toast.proxyOff': 'Proxy desactivado', 'toast.modeAuto': 'Modo automático activado', 'toast.modeManual': 'Modo manual activado', 'toast.ledgerError': 'No se pudo leer el ledger: {error}', 'toast.proxyError': 'No se pudo cambiar el proxy: {error}', 'toast.modeError': 'No se pudo cambiar el modo: {error}', 'toast.demoError': 'No se pudo ejecutar la demo local: {error}', 'toast.agentCopied': 'Configuración copiada', 'toast.agentConfigured': 'Agente configurado; copia de seguridad creada', 'toast.agentsConfigured': '{count} agentes configurados; copias de seguridad creadas', 'toast.agentsPartial': '{ok} agentes configurados; {failed} no se pudieron modificar', 'toast.agentSelect': 'Selecciona al menos un agente instalado', 'toast.agentError': 'No se pudo configurar el agente: {error}', 'toast.proofCopied': 'Prueba copiada al portapapeles', 'toast.proofDownloaded': 'Prueba descargada',
      'onboarding.kicker': 'PRIMER ARRANQUE', 'onboarding.title': 'Mira el valor antes de configurar nada.', 'onboarding.lead': 'aidigest ejecuta una página de ejemplo en local con el mismo pipeline de extracción y seguridad que usará tu agente.', 'onboarding.running': 'Ejecutando prueba local…', 'onboarding.complete': 'Prueba local completada', 'onboarding.raw': 'tokens brutos', 'onboarding.digest': 'tokens digest', 'onboarding.saved': 'ahorrados', 'onboarding.injections': 'Intentos de prompt injection retirados', 'onboarding.start': 'Continuar a configuración',
      'agents.kicker': 'CONFIGURAR AGENTE', 'agents.title': 'Conecta tus agentes', 'agents.lead': 'aidigest detecta los agentes instalados en este equipo. Selecciona uno o varios para preparar su entrada MCP local; el archivo original se conserva como copia de seguridad.', 'agents.scanning': 'Buscando agentes y configuraciones locales…', 'agents.refresh': 'Volver a detectar', 'agents.previewKicker': 'VISTA PREVIA DE CONFIGURACIÓN', 'agents.configure': 'Instalar aidigest en seleccionados', 'agents.detected': 'Instalado', 'agents.notFound': 'No instalado', 'agents.configured': 'Ya configurado', 'agents.app': 'Aplicación encontrada', 'agents.configFile': 'Configuración encontrada', 'agents.selectedOne': '{count} seleccionado', 'agents.selectedMany': '{count} seleccionados', 'agents.selectPrompt': 'Selecciona al menos un agente instalado para ver su configuración.', 'agents.none': 'No se detectaron agentes compatibles en este equipo.', 'agents.backup': 'copia de seguridad', 'agents.unsupported': 'Solo copiar',
      'trust.kicker': 'CENTRO DE CONFIANZA', 'trust.title': 'Qué puede ver aidigest y qué no', 'trust.localTitle': 'Local por defecto', 'trust.localBody': 'Las métricas, ajustes y preferencia de idioma permanecen en este equipo.', 'trust.httpsTitle': 'HTTPS sigue cifrado', 'trust.httpsBody': 'El tráfico CONNECT se tuneliza. aidigest no descifra mediante MITM.', 'trust.limitTitle': 'El cliente puede ignorarlo', 'trust.limitBody': 'Las aplicaciones que ignoran el proxy necesitan MCP o endpoint explícito.', 'trust.rollbackTitle': 'Siempre reversible', 'trust.rollbackBody': 'Pasa a MANUAL o usa la línea de comandos para detener la intercepción automática.', 'trust.configLabel': 'Política actual',
      'proof.kicker': 'PRUEBA COMPARTIBLE', 'proof.title': 'Tu recibo de eficiencia', 'proof.local': 'runtime local', 'proof.lessContext': 'menos contexto', 'proof.tokens': 'tokens ahorrados', 'proof.reads': 'lecturas procesadas', 'proof.money': 'ahorro estimado', 'proof.lead': 'Una instantánea local y verificable. No incluye contenido de páginas.',
    },
    en: {
      'title': 'aidigest · runtime', 'brand.tagline': 'context runtime', 'workspace.local': 'LOCAL WORKSPACE',
      'nav.workspace': 'WORKSPACE', 'nav.overview': 'Overview', 'nav.activity': 'Activity', 'nav.security': 'Security',
      'sidebar.runtime': 'RUNTIME', 'sidebar.ledger': 'Local ledger', 'sidebar.proxy': 'Agent proxy', 'sidebar.agentMode': 'Agent mode',
      'language.label': 'LANGUAGE', 'actions.clearHistory': 'Clear history', 'actions.trustCenter': 'Trust center', 'actions.shareProof': 'Share proof', 'actions.dismiss': 'Not now', 'actions.copyConfig': 'Copy config', 'actions.copyProof': 'Copy proof', 'actions.download': 'Download JSON', 'actions.close': 'Close', 'status.live': 'LIVE', 'status.synced': 'SYNCED', 'status.updating': 'Updating…', 'status.updated': 'Updated {time}',
      'hero.eyebrow': 'LIVE CONTEXT RUNTIME', 'hero.titleA': 'Everything your agent', 'hero.titleB': "didn't have to read.", 'hero.subtitle': 'A local runtime that removes noise, protects context and measures every token before it reaches the model.',
      'metrics.savedTokens': 'Tokens saved', 'metrics.savedTokensFoot': 'Context removed from the flow', 'metrics.reduction': 'Average reduction', 'metrics.reductionFoot': 'Across everything processed', 'metrics.reads': 'Reads processed', 'metrics.readsFoot': 'Sessions in the ledger', 'metrics.savings': 'Estimated savings', 'metrics.quality': 'Average quality', 'metrics.qualityFoot': 'Traceability and structure', 'metrics.cache': 'Cache hit', 'metrics.cacheFoot': 'Intelligent reuse',
      'chart.kicker': 'CONTEXT VOLUME', 'chart.title': 'Compression in real time', 'chart.before': 'Before', 'chart.after': 'After', 'chart.empty': 'Waiting for the first read…', 'chart.range': 'Last 50 reads', 'chart.raw': 'Raw HTML', 'chart.digest': 'Safe digest', 'chart.oldest': 'oldest', 'chart.now': 'now',
      'efficiency.kicker': 'EFFICIENCY', 'efficiency.title': 'Digest performance', 'efficiency.lessContext': 'less context', 'efficiency.sent': 'tokens sent', 'efficiency.rawTokens': 'of {count} raw tokens', 'efficiency.distribution': 'Distribution by mode', 'efficiency.reads': 'reads',
      'activity.kicker': 'EVENT STREAM', 'activity.title': 'Latest reads', 'activity.eventsOne': '{count} event', 'activity.eventsMany': '{count} events', 'activity.emptyShort': 'No activity yet', 'activity.empty': 'No reads yet. When the agent visits a web page, it will appear here.', 'activity.reviewed': 'Reviewed', 'activity.safe': 'Safe',
      'table.time': 'Time', 'table.source': 'Source', 'table.url': 'URL', 'table.before': 'Before', 'table.after': 'After', 'table.reduction': 'Reduction', 'table.status': 'Status',
      'security.kicker': 'CONTEXT GUARD', 'security.title': 'Context security', 'security.detected': 'injections detected', 'security.clean': 'The scrubber is active and checks every digest before delivery.', 'security.attemptOne': '{count} attempt detected and removed before context delivery.', 'security.attemptMany': '{count} attempts detected and removed before context delivery.', 'security.injection': 'Prompt injection', 'security.budgets': 'Budget limits', 'security.ledger': 'Atomic ledger', 'security.sensitive': 'Sensitive data: ', 'security.redactions': ' redactions',
      'controls.proxyKicker': 'NETWORK BRIDGE', 'controls.proxyTitle': 'Agent bridge', 'controls.proxyOff': 'Enable the local proxy to deliver digests automatically.', 'controls.proxyOn': 'The agent can send its URLs through the local bridge.', 'controls.proxyEnable': 'Enable proxy', 'controls.proxyDisable': 'Disable proxy',
      'controls.modeKicker': 'AGENT POLICY', 'controls.modeTitle': 'Agent mode', 'controls.modeManual': 'The agent uses aidigest only when you ask it to.', 'controls.modeAuto': 'Agent reads go through aidigest by default.', 'controls.modeCode': 'automatic ↔ manual', 'controls.modeEnable': 'Enable automatic', 'controls.modeDisable': 'Switch to manual', 'controls.agentKicker': 'AGENT SETUP', 'controls.agentTitle': 'Connect an agent', 'controls.agentHint': 'Detect MCP clients and prepare their config in one step.', 'controls.agentCode': 'Claude · Cursor · OpenCode', 'controls.agentButton': 'Configure',
      'controls.gpuKicker': 'HARDWARE PROBE', 'controls.gpuTitle': 'Graphics acceleration', 'controls.gpuChecking': 'Checking WebGPU and the available device…', 'controls.gpuDetails': 'CPU fallback ready',
      'mode.auto': 'AUTO', 'mode.manual': 'MANUAL', 'proxy.on': 'ON', 'proxy.off': 'OFF', 'gpu.check': 'CHECK', 'gpu.cpu': 'CPU', 'gpu.webgpu': 'WEBGPU', 'gpu.noApi': 'WebGPU is unavailable; the panel keeps a stable fallback.', 'gpu.noAdapter': 'No compatible adapter was found; the safe fallback remains active.', 'gpu.detected': 'GPU available and verified with a local compute probe.', 'gpu.fallbackDetails': 'CPU fallback ready', 'gpu.noAdapterDetails': 'No WebGPU adapter',
      'toast.historyCleared': 'History cleared', 'toast.proxyOn': 'Proxy active on 127.0.0.1:8080', 'toast.proxyOff': 'Proxy disabled', 'toast.modeAuto': 'Automatic mode enabled', 'toast.modeManual': 'Manual mode enabled', 'toast.ledgerError': 'Could not read the ledger: {error}', 'toast.proxyError': 'Could not change the proxy: {error}', 'toast.modeError': 'Could not change the mode: {error}', 'toast.demoError': 'Could not run the local demo: {error}', 'toast.agentCopied': 'Config copied', 'toast.agentConfigured': 'Agent configured; backup created', 'toast.agentsConfigured': '{count} agents configured; backups created', 'toast.agentsPartial': '{ok} agents configured; {failed} could not be modified', 'toast.agentSelect': 'Select at least one installed agent', 'toast.agentError': 'Could not configure the agent: {error}', 'toast.proofCopied': 'Proof copied to clipboard', 'toast.proofDownloaded': 'Proof downloaded',
      'onboarding.kicker': 'FIRST RUN CHECK', 'onboarding.title': 'See the value before you configure anything.', 'onboarding.lead': 'aidigest runs a sample page locally through the same extraction and safety pipeline your agent will use.', 'onboarding.running': 'Running local proof…', 'onboarding.complete': 'Local proof complete', 'onboarding.raw': 'raw tokens', 'onboarding.digest': 'digest tokens', 'onboarding.saved': 'saved', 'onboarding.injections': 'Prompt injection attempts removed', 'onboarding.start': 'Continue to setup',
      'agents.kicker': 'AGENT SETUP', 'agents.title': 'Connect your agents', 'agents.lead': 'aidigest detects compatible agents installed on this machine. Select one or more to prepare their local MCP entry; the original file is kept as a backup.', 'agents.scanning': 'Scanning installed agents and local configs…', 'agents.refresh': 'Scan again', 'agents.previewKicker': 'CONFIG PREVIEW', 'agents.configure': 'Install aidigest in selected', 'agents.detected': 'Installed', 'agents.notFound': 'Not installed', 'agents.configured': 'Already configured', 'agents.app': 'Application found', 'agents.configFile': 'Config found', 'agents.selectedOne': '{count} selected', 'agents.selectedMany': '{count} selected', 'agents.selectPrompt': 'Select at least one installed agent to preview its configuration.', 'agents.none': 'No compatible agents were detected on this machine.', 'agents.backup': 'backup', 'agents.unsupported': 'Copy only',
      'trust.kicker': 'TRUST CENTER', 'trust.title': 'What aidigest can and cannot see', 'trust.localTitle': 'Local by default', 'trust.localBody': 'Stats, settings and language preference stay on this machine.', 'trust.httpsTitle': 'HTTPS stays encrypted', 'trust.httpsBody': 'CONNECT traffic is tunneled. aidigest does not perform MITM decryption.', 'trust.limitTitle': 'Clients can opt out', 'trust.limitBody': 'Apps that ignore proxy settings need explicit MCP or endpoint configuration.', 'trust.rollbackTitle': 'Always reversible', 'trust.rollbackBody': 'Switch to MANUAL or use the command line to stop automatic interception.', 'trust.configLabel': 'Current policy',
      'proof.kicker': 'SHAREABLE PROOF', 'proof.title': 'Your efficiency receipt', 'proof.local': 'local runtime', 'proof.lessContext': 'less context', 'proof.tokens': 'tokens saved', 'proof.reads': 'reads processed', 'proof.money': 'estimated savings', 'proof.lead': 'A local, verifiable snapshot. No page content is included.',
    },
  };

  const $ = (id) => document.getElementById(id);
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const formatUrl = (value) => { const text = String(value ?? ''); return text.length > 62 ? `${text.slice(0, 59)}…` : text; };
  const savedLocale = (() => { try { return localStorage.getItem('aidigest-locale'); } catch { return null; } })();
  let locale = savedLocale === 'en' || savedLocale === 'es' ? savedLocale : (navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es');
  let nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES');
  let money = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 });
  let snapshot = { summary: { runs: 0, before: 0, after: 0, saved: 0, savedPct: 0, estimatedSavedUsd: 0, model: 'gpt-4o-mini', inputUsdPerMillion: .15, byMode: {}, injections: 0 }, recent: [], statsFile: '' };

  function t(key, vars = {}) {
    let value = copy[locale][key] ?? copy.en[key] ?? key;
    return Object.entries(vars).reduce((result, [name, replacement]) => result.replaceAll(`{${name}}`, String(replacement)), value);
  }

  function applyLocale() {
    document.documentElement.lang = locale;
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
    ['langEs', 'topLangEs'].forEach((id) => $(id)?.classList.toggle('active', locale === 'es'));
    ['langEn', 'topLangEn'].forEach((id) => $(id)?.classList.toggle('active', locale === 'en'));
    nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES');
    money = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 });
    render(snapshot);
  }

  async function setLocale(next) {
    if (next !== 'es' && next !== 'en') return;
    locale = next;
    try { localStorage.setItem('aidigest-locale', locale); } catch { /* localStorage may be unavailable in a locked renderer */ }
    applyLocale();
    await renderProxy();
    await renderMode();
    await detectGpu();
  }

  async function refresh() {
    try {
      snapshot = await window.aidigest.getSnapshot();
      render(snapshot);
      await renderProxy();
      await renderMode();
    } catch (error) { showToast(t('toast.ledgerError', { error: error.message })); }
  }

  function showModal(id) { $(id).classList.remove('hidden'); }
  function hideModal(id) { $(id).classList.add('hidden'); }

  async function runDemo() {
    try {
      const result = await window.aidigest.runDemo();
      $('demoBefore').textContent = nf.format(result.before);
      $('demoAfter').textContent = nf.format(result.after);
      $('demoSaved').textContent = `${result.savedPct}%`;
      $('demoInjection').textContent = nf.format(result.injections);
      $('demoStatus').textContent = t('onboarding.complete');
    } catch (error) {
      $('demoStatus').textContent = t('toast.demoError', { error: error.message });
      showToast(t('toast.demoError', { error: error.message }));
    }
  }

  function proofPayload() {
    const s = snapshot.summary;
    return { product: 'aidigest', version: '0.8.1', generatedAt: new Date().toISOString(), runs: s.runs, tokensSaved: s.saved, reductionPct: s.savedPct, estimatedSavedUsd: s.estimatedSavedUsd, injectionsRemoved: s.injections, model: s.model };
  }

  async function copyText(value, successKey) {
    try { await navigator.clipboard.writeText(value); } catch {
      const area = document.createElement('textarea'); area.value = value; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
    }
    showToast(t(successKey));
  }

  function openProof() {
    const s = snapshot.summary;
    $('proofSaved').textContent = `${s.savedPct}%`;
    $('proofTokens').textContent = nf.format(s.saved);
    $('proofRuns').textContent = nf.format(s.runs);
    $('proofMoney').textContent = money.format(s.estimatedSavedUsd);
    $('proofDate').textContent = new Date().toLocaleString(locale === 'en' ? 'en-US' : 'es-ES');
    showModal('proofOverlay');
  }

  async function openTrust() {
    const config = await window.aidigest.getModeStatus();
    $('trustPolicy').textContent = config.mode === 'automatic' ? t('mode.auto') : t('mode.manual');
    $('trustPolicy').className = config.mode === 'automatic' ? 'policy-auto' : 'policy-manual';
    $('trustConfigPath').textContent = config.configFile || '~/.aidigest/config.json';
    showModal('trustOverlay');
  }

  let agentChoices = [];
  let selectedAgentIds = new Set();

  async function openAgents() {
    showModal('agentOverlay');
    $('agentList').innerHTML = `<div class="no-data">${safe(t('agents.scanning'))}</div>`;
    try {
      agentChoices = await window.aidigest.detectAgents();
      const available = agentChoices.filter((item) => item.detected && !item.configured);
      const detected = agentChoices.filter((item) => item.detected);
      selectedAgentIds = new Set((available.length ? available : detected).map((item) => item.id));
      renderAgents();
      await renderAgentPreview();
    } catch (error) { $('agentList').innerHTML = `<div class="no-data">${safe(t('toast.agentError', { error: error.message }))}</div>`; }
  }

  function renderAgents() {
    const selectedCount = selectedAgentIds.size;
    $('agentSelectionCount').textContent = t(selectedCount === 1 ? 'agents.selectedOne' : 'agents.selectedMany', { count: selectedCount });
    $('agentConfigure').disabled = selectedCount === 0;
    $('agentCopy').disabled = selectedCount === 0;
    if (!agentChoices.length) {
      $('agentList').innerHTML = `<div class="no-data">${safe(t('agents.none'))}</div>`;
      return;
    }
    $('agentList').innerHTML = agentChoices.map((agent) => {
      const status = agent.configured ? t('agents.configured') : agent.detected ? t('agents.detected') : t('agents.notFound');
      const selected = selectedAgentIds.has(agent.id);
      const source = agent.detectedBy?.includes('app') ? t('agents.app') : agent.detectedBy?.includes('config') ? t('agents.configFile') : '';
      return `<button class="agent-option ${selected ? 'selected' : ''}" data-agent-id="${safe(agent.id)}" type="button" ${agent.detected ? '' : 'disabled'} aria-pressed="${selected}"><span class="agent-checkbox">${selected ? '✓' : ''}</span><span class="agent-name"><strong>${safe(agent.name)}</strong><small>${safe(agent.path)}</small>${source ? `<small class="agent-source">${safe(source)}</small>` : ''}</span><span class="agent-status ${agent.detected ? 'found' : ''}">${safe(status)}</span></button>`;
    }).join('');
    document.querySelectorAll('.agent-option:not([disabled])').forEach((button) => button.addEventListener('click', async () => {
      const id = button.dataset.agentId;
      if (selectedAgentIds.has(id)) selectedAgentIds.delete(id); else selectedAgentIds.add(id);
      renderAgents();
      await renderAgentPreview();
    }));
  }

  async function renderAgentPreview() {
    const ids = [...selectedAgentIds];
    if (!ids.length) { $('agentConfigPreview').textContent = t('agents.selectPrompt'); return; }
    const config = await window.aidigest.getAgentConfig(ids.length === 1 ? ids[0] : ids);
    $('agentConfigPreview').textContent = JSON.stringify(config, null, 2);
  }

  async function configureAgent() {
    const ids = [...selectedAgentIds];
    if (!ids.length) { showToast(t('toast.agentSelect')); return; }
    $('agentConfigure').disabled = true;
    try {
      const result = await window.aidigest.configureAgent(ids);
      const ok = result.results.filter((item) => item.ok).length;
      const failed = result.results.length - ok;
      if (failed) showToast(t('toast.agentsPartial', { ok, failed }));
      else if (ok === 1) showToast(t('toast.agentConfigured'));
      else showToast(t('toast.agentsConfigured', { count: ok }));
      await openAgents();
    } catch (error) { showToast(t('toast.agentError', { error: error.message })); }
  }

  async function renderProxy() {
    const status = await window.aidigest.getProxyStatus();
    const on = status.on === true;
    $('proxyState').textContent = on ? t('proxy.on') : t('proxy.off');
    $('proxyDot').classList.toggle('on', on);
    $('proxyToggle').textContent = on ? t('controls.proxyDisable') : t('controls.proxyEnable');
    $('proxyToggle').classList.toggle('on', on);
    $('proxyAddress').textContent = on ? `http://127.0.0.1:${status.port}/?url=<url>` : '127.0.0.1:8080';
    $('proxyHint').textContent = on ? t('controls.proxyOn') : t('controls.proxyOff');
  }

  async function renderMode() {
    const config = await window.aidigest.getModeStatus();
    const automatic = config.mode === 'automatic';
    $('modeState').textContent = automatic ? t('mode.auto') : t('mode.manual');
    $('modeDot').classList.toggle('on', automatic);
    $('modeToggle').textContent = automatic ? t('controls.modeDisable') : t('controls.modeEnable');
    $('modeToggle').classList.toggle('on', automatic);
    $('modeHint').textContent = automatic ? t('controls.modeAuto') : t('controls.modeManual');
  }

  async function detectGpu() {
    const set = (stateKey, hintKey, details, tone = '') => {
      $('gpuState').textContent = t(stateKey);
      $('gpuHint').textContent = t(hintKey);
      $('gpuDetails').textContent = details;
      $('gpuState').className = `gpu-state ${tone}`;
    };
    if (!navigator.gpu) { set('gpu.cpu', 'gpu.noApi', t('gpu.fallbackDetails'), 'warn'); return; }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) { set('gpu.cpu', 'gpu.noAdapter', t('gpu.noAdapterDetails'), 'warn'); return; }
      const device = await adapter.requestDevice();
      const started = performance.now();
      const module = device.createShaderModule({ code: '@compute @workgroup_size(1) fn main() {}' });
      const pipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } });
      const encoder = device.createCommandEncoder(); const pass = encoder.beginComputePass(); pass.setPipeline(pipeline); pass.dispatchWorkgroups(1); pass.end(); device.queue.submit([encoder.finish()]);
      if (device.queue.onSubmittedWorkDone) await device.queue.onSubmittedWorkDone();
      const info = adapter.info || {}; const label = [info.vendor, info.architecture, info.device].filter(Boolean).join(' / ') || 'WebGPU adapter';
      set('gpu.webgpu', 'gpu.detected', `${label} · ${Math.round((performance.now() - started) * 100) / 100} ms`, 'on');
    } catch (error) { set('gpu.cpu', 'gpu.noApi', String(error.message || error).slice(0, 90), 'warn'); }
  }

  function render(data) {
    const s = data.summary;
    $('savedTokens').textContent = nf.format(s.saved); $('savedPct').textContent = `${s.savedPct}%`; $('runs').textContent = nf.format(s.runs); $('savedUsd').textContent = money.format(s.estimatedSavedUsd); $('modelLabel').textContent = s.model;
    $('qualityScore').textContent = `${s.averageQuality || 0}/100`; $('cacheHit').textContent = `${s.runs ? Math.round(((s.cacheHits || 0) / s.runs) * 100) : 0}%`; $('tokensAfter').textContent = nf.format(s.after); $('tokensBefore').textContent = t('efficiency.rawTokens', { count: nf.format(s.before) });
    $('ringValue').textContent = `${s.savedPct}%`; $('savingsRing').style.setProperty('--pct', `${Math.max(0, Math.min(100, s.savedPct))}%`); $('injectionCount').textContent = nf.format(s.injections); $('redactionCount').textContent = nf.format(s.redactions || 0); $('securityMeter').style.width = `${s.injections ? Math.min(100, Math.max(4, s.injections * 5)) : 2}%`;
    $('securityNote').textContent = s.injections ? t(s.injections === 1 ? 'security.attemptOne' : 'security.attemptMany', { count: nf.format(s.injections) }) : t('security.clean');
    $('eventCount').textContent = t(s.runs === 1 ? 'activity.eventsOne' : 'activity.eventsMany', { count: nf.format(s.runs) }); $('lastUpdated').textContent = t('status.updated', { time: new Date().toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-ES') }); $('statsPath').textContent = data.statsFile || '~/.aidigest/stats.json';
    renderModeBars(s.byMode || {}); renderRows(data.recent || []); drawChart(data.recent || []);
  }

  function renderModeBars(byMode) {
    const entries = Object.entries(byMode).sort((a, b) => b[1] - a[1]); const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (!entries.length) { $('modeBars').innerHTML = `<div class="no-data">${safe(t('activity.emptyShort'))}</div>`; return; }
    $('modeBars').innerHTML = entries.slice(0, 4).map(([mode, count]) => { const width = total ? Math.max(4, Math.round((count / total) * 100)) : 0; return `<div class="mode-row"><span>${safe(mode)}</span><div class="mode-track"><span style="width:${width}%"></span></div><b>${count}</b></div>`; }).join('');
  }

  function renderRows(entries) {
    if (!entries.length) { $('activityRows').innerHTML = `<tr><td colspan="7" class="no-data">${safe(t('activity.empty'))}</td></tr>`; return; }
    $('activityRows').innerHTML = entries.slice(0, 12).map((entry) => { const injection = Number(entry.injections || 0) > 0; const time = new Date(entry.at).toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-ES'); return `<tr><td>${safe(time)}</td><td><span class="source-pill">${safe(entry.source || 'cli')}</span></td><td title="${safe(entry.url)}">${safe(formatUrl(entry.url))}</td><td>${nf.format(entry.before)}</td><td>${nf.format(entry.after)}</td><td>${safe(entry.savedPct)}%</td><td><span class="${injection ? 'warn-pill' : 'safe-pill'}">${injection ? t('activity.reviewed') : t('activity.safe')}</span></td></tr>`; }).join('');
  }

  function drawChart(entries) {
    const canvas = $('tokenChart'); const empty = $('emptyChart'); const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; canvas.width = Math.max(1, Math.floor(rect.width * dpr)); canvas.height = Math.max(1, Math.floor(rect.height * dpr)); const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); const width = rect.width; const height = rect.height; ctx.clearRect(0, 0, width, height);
    if (!entries.length) { empty.style.display = 'grid'; return; } empty.style.display = 'none';
    const pad = { top: 14, right: 10, bottom: 27, left: 42 }; const chartWidth = width - pad.left - pad.right; const chartHeight = height - pad.top - pad.bottom; const max = Math.max(1, ...entries.map((entry) => Math.max(Number(entry.before) || 0, Number(entry.after) || 0))); const ticks = 4;
    ctx.font = '9px Consolas, monospace'; ctx.lineWidth = 1;
    for (let i = 0; i <= ticks; i += 1) { const y = pad.top + chartHeight - (chartHeight * i / ticks); ctx.strokeStyle = '#292622'; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke(); ctx.fillStyle = '#706961'; ctx.fillText(formatCompact(max * i / ticks), 0, y + 3); }
    const drawLine = (key, color) => { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); entries.forEach((entry, index) => { const x = entries.length === 1 ? pad.left + chartWidth / 2 : pad.left + (chartWidth * index / (entries.length - 1)); const value = Number(entry[key]) || 0; const y = pad.top + chartHeight - (value / max * chartHeight); if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); };
    drawLine('before', '#91c7ff'); drawLine('after', '#f27a4b');
    const latest = entries[entries.length - 1]; const x = entries.length === 1 ? pad.left + chartWidth / 2 : pad.left + chartWidth; ['before', 'after'].forEach((key, index) => { const value = Number(latest[key]) || 0; const y = pad.top + chartHeight - (value / max * chartHeight); ctx.fillStyle = index === 0 ? '#91c7ff' : '#f27a4b'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#706961'; ctx.fillText(t('chart.oldest'), pad.left, height - 6); ctx.textAlign = 'right'; ctx.fillText(t('chart.now'), width - pad.right, height - 6); ctx.textAlign = 'left';
  }

  function formatCompact(value) { if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `${(value / 1000).toFixed(1)}k`; return Math.round(value).toString(); }
  function showToast(message) { const toast = $('toast'); toast.textContent = message; toast.classList.add('show'); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3000); }

  document.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => setLocale(button.dataset.locale)));
  $('minimizeButton').addEventListener('click', () => window.aidigest.minimize()); $('maximizeButton').addEventListener('click', () => window.aidigest.toggleMaximize()); $('closeButton').addEventListener('click', () => window.aidigest.close());
  $('resetButton').addEventListener('click', async () => { if (!window.confirm(locale === 'es' ? '¿Vaciar todas las métricas guardadas?' : 'Clear all saved metrics?')) return; await window.aidigest.resetStats(); await refresh(); showToast(t('toast.historyCleared')); });
  $('proxyToggle').addEventListener('click', async () => { try { const status = await window.aidigest.getProxyStatus(); await window.aidigest.toggleProxy(!status.on); await renderProxy(); showToast(status.on ? t('toast.proxyOff') : t('toast.proxyOn')); } catch (error) { showToast(t('toast.proxyError', { error: error.message })); } });
  $('modeToggle').addEventListener('click', async () => { try { const current = await window.aidigest.getModeStatus(); const next = current.mode === 'automatic' ? 'manual' : 'automatic'; await window.aidigest.setMode(next); await renderMode(); await renderProxy(); showToast(next === 'automatic' ? t('toast.modeAuto') : t('toast.modeManual')); } catch (error) { showToast(t('toast.modeError', { error: error.message })); } });
  window.aidigest.onTrayMode(async (next) => { try { await window.aidigest.setMode(next); await renderMode(); await renderProxy(); showToast(next === 'automatic' ? t('toast.modeAuto') : t('toast.modeManual')); } catch (error) { showToast(t('toast.modeError', { error: error.message })); } });
  $('trustButton').addEventListener('click', () => openTrust());
  $('shareButton').addEventListener('click', () => openProof());
  $('agentButton').addEventListener('click', () => openAgents());
  $('agentClose').addEventListener('click', () => hideModal('agentOverlay'));
  $('agentRefresh').addEventListener('click', () => openAgents());
  $('agentCopy').addEventListener('click', async () => { const ids = [...selectedAgentIds]; if (!ids.length) { showToast(t('toast.agentSelect')); return; } const config = await window.aidigest.getAgentConfig(ids.length === 1 ? ids[0] : ids); await copyText(JSON.stringify(config, null, 2), 'toast.agentCopied'); });
  $('agentConfigure').addEventListener('click', () => configureAgent());
  $('trustClose').addEventListener('click', () => hideModal('trustOverlay'));
  $('trustCloseBottom').addEventListener('click', () => hideModal('trustOverlay'));
  $('proofClose').addEventListener('click', () => hideModal('proofOverlay'));
  $('proofCopy').addEventListener('click', () => copyText(JSON.stringify(proofPayload(), null, 2), 'toast.proofCopied'));
  $('proofDownload').addEventListener('click', () => { const blob = new Blob([JSON.stringify(proofPayload(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `aidigest-proof-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); showToast(t('toast.proofDownloaded')); });
  $('onboardingDismiss').addEventListener('click', () => { try { localStorage.setItem('aidigest-onboarding-complete', '1'); } catch {} hideModal('onboardingOverlay'); });
  $('onboardingStart').addEventListener('click', () => { try { localStorage.setItem('aidigest-onboarding-complete', '1'); } catch {} hideModal('onboardingOverlay'); openAgents(); });
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) backdrop.classList.add('hidden'); }));
  const viewKeys = { overview: 'nav.overview', activity: 'nav.activity', security: 'nav.security' };
  document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active')); button.classList.add('active'); $('currentView').textContent = t(viewKeys[button.dataset.view]); const target = button.dataset.view === 'overview' ? document.querySelector('.hero') : $(button.dataset.view === 'activity' ? 'activityView' : 'securityView'); target?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  window.addEventListener('resize', () => drawChart(snapshot.recent || []));
  applyLocale(); detectGpu(); refresh();
  window.setTimeout(() => {
    let completed = false;
    try { completed = localStorage.getItem('aidigest-onboarding-complete') === '1'; } catch {}
    if (!completed) { showModal('onboardingOverlay'); runDemo(); }
  }, 350);
  window.setInterval(refresh, 1000);
})();

