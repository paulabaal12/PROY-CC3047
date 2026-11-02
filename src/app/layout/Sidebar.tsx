import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import { Tooltip } from '@mui/material';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { t } from '@/config/texts';
import { RoleSelector, useRole } from '@/features/auth';
import clsx from '@/utils/clsx';
import styles from './Sidebar.module.scss';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  internal?: boolean;
}

const NAV: NavItem[] = [
  { to: '/tickets/new', label: t.nav.newTicket, icon: <AddCircleOutlineIcon /> },
  { to: '/tickets', label: t.nav.myTickets, icon: <ListAltOutlinedIcon /> },
  { to: '/catalog', label: t.nav.catalog, icon: <MenuBookOutlinedIcon /> },
  { to: '/board', label: t.nav.board, icon: <ViewKanbanOutlinedIcon />, internal: true },
  { to: '/problems', label: t.nav.problems, icon: <BugReportOutlinedIcon />, internal: true },
  { to: '/dashboard', label: t.nav.dashboard, icon: <InsightsOutlinedIcon />, internal: true },
  { to: '/settings', label: t.nav.settings, icon: <SettingsOutlinedIcon /> },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isInternal } = useRole();
  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>
          SD
        </span>
        <div>
          <p className={styles.name}>{t.app.name}</p>
          <p className={styles.service}>{t.app.service}</p>
        </div>
      </div>

      <RoleSelector />

      <nav className={styles.nav} aria-label="Navegación principal">
        {NAV.map((item) => {
          const locked = item.internal && !isInternal;
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/tickets'}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(styles.link, isActive && styles.active, locked && styles.locked)
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {locked && (
                <LockOutlinedIcon className={styles.lock} aria-label={t.nav.internalOnly} />
              )}
            </NavLink>
          );
          return locked ? (
            <Tooltip key={item.to} title={t.nav.internalOnly} placement="right">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      <p className={styles.footnote}>
        <em>{t.app.tagline}</em>
        <br />
        {t.app.course}
      </p>
    </div>
  );
}
