import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { DataTable, Panel, PageHeader, PriorityChip, type Column } from '@/components';
import { IMPACT_CRITERIA, IMPACTS, URGENCIES, URGENCY_CRITERIA } from '@/config/priorityMatrix';
import { CHANNELS, PROVIDERS, ROLES } from '@/config/roles';
import { servicesOfType, type ServiceDef } from '@/config/services';
import { SERVICE_WINDOW } from '@/config/sla';
import type { TicketType } from '@/types';
import { formatBusinessMinutes } from '@/utils/businessHours';
import { calculatePriority, getSlaTargets } from '@/utils/priority';
import { PriorityMatrixTable } from './PriorityMatrixTable';
import styles from './Catalog.module.scss';

function serviceColumns(type: TicketType): Column<ServiceDef>[] {
  return [
    {
      key: 'service',
      header: type === 'Incidente' ? 'Incidente tipificado' : 'Solicitud de servicio',
      wrap: true,
      render: (svc) => (
        <div className={styles.serviceCell}>
          <span className={styles.serviceName}>{svc.name}</span>
          <span className={styles.why}>
            <strong>¿Por qué es {type === 'Incidente' ? 'un incidente' : 'una solicitud'}?</strong>{' '}
            {svc.justification}
          </span>
        </div>
      ),
    },
    {
      key: 'who',
      header: type === 'Incidente' ? 'Quién lo reporta' : 'Quién lo solicita',
      width: '22%',
      wrap: true,
      hideBelow: 'lg',
      render: (svc) => <span className={styles.muted}>{svc.requestedBy}</span>,
    },
    {
      key: 'priority',
      header: 'Prioridad sugerida',
      width: '208px',
      hideBelow: 'md',
      wrap: true,
      render: (svc) => {
        const targets = getSlaTargets(svc.defaultImpact, svc.defaultUrgency);
        return (
          <div className={styles.priorityCell}>
            <PriorityChip priority={calculatePriority(svc.defaultImpact, svc.defaultUrgency)} />
            <span className={styles.muted}>
              Resp. {formatBusinessMinutes(targets.responseMinutes)} · resol.{' '}
              {formatBusinessMinutes(targets.resolutionMinutes)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'action',
      header: '',
      width: '132px',
      align: 'right',
      render: (svc) => (
        <Button
          component={RouterLink}
          to={`/tickets/new?category=${svc.id}`}
          variant="outlined"
          size="small"
        >
          Crear ticket
        </Button>
      ),
    },
  ];
}

export function CatalogPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Portal' }, { label: 'Catálogo de servicios' }]}
        title="Catálogo de servicios"
        subtitle="4 solicitudes y 3 incidentes tipificados, con su justificación ITIL."
      />

      <div className={styles.stack}>
        <section>
          <h2 className={styles.sectionTitle}>
            Solicitudes de servicio <span>4</span>
          </h2>
          <DataTable
            columns={serviceColumns('Solicitud')}
            rows={servicesOfType('Solicitud')}
            getKey={(s) => s.id}
            caption="Solicitudes de servicio"
          />
        </section>

        <section>
          <h2 className={styles.sectionTitle}>
            Incidentes tipificados <span>3</span>
          </h2>
          <DataTable
            columns={serviceColumns('Incidente')}
            rows={servicesOfType('Incidente')}
            getKey={(s) => s.id}
            caption="Incidentes tipificados"
          />
        </section>

        <Panel
          title="Matriz de prioridad"
          subtitle={`Ventana de servicio: ${SERVICE_WINDOW.label}`}
        >
          <PriorityMatrixTable />
          <div className={styles.criteria}>
            <div>
              <h3>Impacto</h3>
              <dl>
                {IMPACTS.map((i) => (
                  <div key={i}>
                    <dt>{i}</dt>
                    <dd>{IMPACT_CRITERIA[i]}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3>Urgencia</h3>
              <dl>
                {URGENCIES.map((u) => (
                  <div key={u}>
                    <dt>{u}</dt>
                    <dd>{URGENCY_CRITERIA[u]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Panel>

        <div className={styles.twoCols}>
          <Panel title="Canales de ingreso">
            <dl className={styles.kv}>
              {CHANNELS.map((c) => (
                <div key={c.id}>
                  <dt>{c.id}</dt>
                  <dd>{c.description}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="Roles y niveles de soporte">
            <dl className={styles.kv}>
              {ROLES.map((r) => (
                <div key={r.id}>
                  <dt>{r.name}</dt>
                  <dd>{r.description}</dd>
                </div>
              ))}
              <div>
                <dt>Nivel 3 (proveedores)</dt>
                <dd>{PROVIDERS.map((p) => p.name).join(', ')}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
