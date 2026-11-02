import AddIcon from '@mui/icons-material/Add';
import { Button, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Panel, PageHeader, PriorityChip, TypeChip } from '@/components';
import { IMPACT_CRITERIA, IMPACTS, URGENCIES, URGENCY_CRITERIA } from '@/config/priorityMatrix';
import { CHANNELS, PROVIDERS, ROLES } from '@/config/roles';
import { servicesOfType, type ServiceDef } from '@/config/services';
import { SERVICE_WINDOW } from '@/config/sla';
import { formatBusinessMinutes } from '@/utils/businessHours';
import { calculatePriority, getSlaTargets } from '@/utils/priority';
import { PriorityMatrixTable } from './PriorityMatrixTable';
import styles from './Catalog.module.scss';

function ServiceCard({ svc, index }: { svc: ServiceDef; index: number }) {
  const priority = calculatePriority(svc.defaultImpact, svc.defaultUrgency);
  const targets = getSlaTargets(svc.defaultImpact, svc.defaultUrgency);
  return (
    <Panel className={styles.service} as="article">
      <div className={styles.serviceTop}>
        <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
        <TypeChip type={svc.type} />
      </div>
      <h3 className={styles.serviceName}>{svc.name}</h3>
      <p className={styles.why}>
        <span>¿Por qué es {svc.type === 'Incidente' ? 'un incidente' : 'una solicitud'}?</span>{' '}
        {svc.justification}
      </p>
      <dl className={styles.facts}>
        <div>
          <dt>{svc.type === 'Incidente' ? 'Quién lo reporta' : 'Quién lo solicita'}</dt>
          <dd>{svc.requestedBy}</dd>
        </div>
        <div>
          <dt>Quién lo atiende</dt>
          <dd>{svc.handledBy}</dd>
        </div>
        <div>
          <dt>Prioridad sugerida</dt>
          <dd className={styles.inline}>
            <PriorityChip priority={priority} /> {svc.defaultImpact}/{svc.defaultUrgency} · resp.{' '}
            {formatBusinessMinutes(targets.responseMinutes)} · resol.{' '}
            {formatBusinessMinutes(targets.resolutionMinutes)}
          </dd>
        </div>
        <div>
          <dt>Datos que pide</dt>
          <dd className={styles.fieldChips}>
            {svc.fields.map((f) => (
              <Chip
                key={f.id}
                size="small"
                label={f.label}
                variant={f.required ? 'filled' : 'outlined'}
              />
            ))}
          </dd>
        </div>
        <div>
          <dt>Ejemplos</dt>
          <dd>{svc.examples.join(' · ')}</dd>
        </div>
      </dl>
      <Button
        component={RouterLink}
        to={`/tickets/new?category=${svc.id}`}
        variant="contained"
        startIcon={<AddIcon />}
        className={styles.cta}
      >
        Crear ticket de este servicio
      </Button>
    </Panel>
  );
}

export function CatalogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fase 1 · Catálogo"
        title="Catálogo de servicios"
        subtitle="Las 4 solicitudes de servicio y los 3 incidentes tipificados de centralamerica.games, con su justificación ITIL."
      />

      <h2 className={styles.sectionTitle}>
        Solicitudes de servicio <em>(4)</em>
      </h2>
      <div className={styles.grid}>
        {servicesOfType('Solicitud').map((svc, i) => (
          <ServiceCard key={svc.id} svc={svc} index={i} />
        ))}
      </div>

      <h2 className={styles.sectionTitle}>
        Incidentes tipificados <em>(3)</em>
      </h2>
      <div className={styles.grid}>
        {servicesOfType('Incidente').map((svc, i) => (
          <ServiceCard key={svc.id} svc={svc} index={i} />
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Matriz de prioridad</h2>
      <Panel>
        <PriorityMatrixTable />
        <div className={styles.criteria}>
          <div>
            <h3>Impacto</h3>
            <ul>
              {IMPACTS.map((i) => (
                <li key={i}>
                  <strong>{i}:</strong> {IMPACT_CRITERIA[i]}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Urgencia</h3>
            <ul>
              {URGENCIES.map((u) => (
                <li key={u}>
                  <strong>{u}:</strong> {URGENCY_CRITERIA[u]}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className={styles.window}>
          Ventana de servicio: <strong>{SERVICE_WINDOW.label}</strong>. Los canales reciben casos
          fuera de ventana, pero el reloj del SLA no corre.
        </p>
      </Panel>

      <div className={styles.twoCols}>
        <Panel title="Canales de ingreso">
          <ul className={styles.plainList}>
            {CHANNELS.map((c) => (
              <li key={c.id}>
                <strong>{c.id}:</strong> {c.description}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Roles y niveles de soporte">
          <ul className={styles.plainList}>
            {ROLES.map((r) => (
              <li key={r.id}>
                <strong>{r.name}:</strong> {r.description}
              </li>
            ))}
            <li>
              <strong>Nivel 3 (proveedores):</strong>{' '}
              {PROVIDERS.map((p) => `${p.name} (${p.scope})`).join('; ')}.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
