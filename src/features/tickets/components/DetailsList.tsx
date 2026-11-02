import { countryName, findGame, findStudio, GAME_STATUS_LABELS } from '@/config/catalogReference';
import { NEW_STUDIO, serviceById, type FieldDef } from '@/config/services';
import type { DetailValue, GameStatus, Ticket } from '@/types';
import { formatDateTime } from '@/utils/dates';
import styles from './DetailsList.module.scss';

function display(field: FieldDef, value: DetailValue | undefined): string {
  if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0))
    return '—';
  if (field.kind === 'studio' && typeof value === 'string')
    return value === NEW_STUDIO ? 'Nuevo estudio' : (findStudio(value)?.name ?? value);
  if (field.kind === 'game' && typeof value === 'string') return findGame(value)?.name ?? value;
  if (field.kind === 'datetime' && typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : formatDateTime(d);
  }
  const values = Array.isArray(value) ? value : [value];
  if (field.id === 'pais' || field.id === 'filtroPais') return values.map(countryName).join(', ');
  if (field.id === 'filtroEstado')
    return values.map((v) => GAME_STATUS_LABELS[v as GameStatus] ?? v).join(', ');
  return values.join(', ');
}

/** Category-specific fields of the ticket, labelled from config/services. */
export function DetailsList({ ticket }: { ticket: Ticket }) {
  const fields = serviceById(ticket.category).fields;
  const studio = findStudio(ticket.relatedStudioId);
  const game = findGame(ticket.relatedGameSlug);
  return (
    <>
      <dl className={styles.list}>
        {fields.map((f) => (
          <div key={f.id} className={styles.item}>
            <dt>{f.label}</dt>
            <dd>{display(f, ticket.details[f.id])}</dd>
          </div>
        ))}
      </dl>
      {(studio || game) && (
        <p className={styles.catalog}>
          Ficha del catálogo:{' '}
          {studio && (
            <a
              href={`https://centralamerica.games/es/estudios/${studio.id}/`}
              target="_blank"
              rel="noreferrer"
            >
              {studio.name} ({countryName(studio.country)})
            </a>
          )}
          {studio && game && ' · '}
          {game && (
            <a
              href={`https://centralamerica.games/es/juegos/${game.slug}/`}
              target="_blank"
              rel="noreferrer"
            >
              {game.name}
            </a>
          )}
        </p>
      )}
    </>
  );
}
