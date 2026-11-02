import { PriorityChip } from '@/components';
import {
  IMPACT_CRITERIA,
  IMPACTS,
  PRIORITY_MATRIX,
  URGENCIES,
  URGENCY_CRITERIA,
} from '@/config/priorityMatrix';
import styles from './Catalog.module.scss';

export function PriorityMatrixTable() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.matrix}>
        <caption className="visually-hidden">Matriz de prioridad: impacto por urgencia</caption>
        <thead>
          <tr>
            <th scope="col">Impacto \ Urgencia</th>
            {URGENCIES.map((u) => (
              <th key={u} scope="col" title={URGENCY_CRITERIA[u]}>
                {u}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {IMPACTS.map((i) => (
            <tr key={i}>
              <th scope="row" title={IMPACT_CRITERIA[i]}>
                {i}
              </th>
              {URGENCIES.map((u) => {
                const cell = PRIORITY_MATRIX[i][u];
                return (
                  <td key={u}>
                    <PriorityChip priority={cell.priority} />
                    <span>{cell.label}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
