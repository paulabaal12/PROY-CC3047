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

const MAIN: NavItem[] = [
  { to: '/tickets/new', label: t.nav.newTicket, icon: <AddCircleOutlineIcon /> },
  { to: '/tickets', label: t.nav.myTickets, icon: <ListAltOutlinedIcon /> },
  { to: '/catalog', label: t.nav.catalog, icon: <MenuBookOutlinedIcon /> },
];

const SUPPORT: NavItem[] = [
  { to: '/board', label: t.nav.board, icon: <ViewKanbanOutlinedIcon />, internal: true },
  { to: '/problems', label: t.nav.problems, icon: <BugReportOutlinedIcon />, internal: true },
  { to: '/dashboard', label: t.nav.dashboard, icon: <InsightsOutlinedIcon />, internal: true },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isInternal } = useRole();

  const renderItem = (item: NavItem) => {
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
        <span className={styles.icon}>{item.icon}</span>
        <span className={styles.label}>{item.label}</span>
        {locked && <LockOutlinedIcon className={styles.lock} aria-label={t.nav.internalOnly} />}
      </NavLink>
    );
    return locked ? (
      <Tooltip key={item.to} title={t.nav.internalOnly} placement="right">
        {link}
      </Tooltip>
    ) : (
      link
    );
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>
          <ViewKanbanOutlinedIcon />
        </span>
        <div className={styles.brandText}>
          <p className={styles.name}>{t.app.name}</p>
          <p className={styles.service}>{t.app.service}</p>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Navegación principal">
        <p className={styles.group}>Portal</p>
        {MAIN.map(renderItem)}
        <p className={styles.group}>Soporte</p>
        {SUPPORT.map(renderItem)}
        <p className={styles.group}>Cuenta</p>
        {renderItem({ to: '/settings', label: t.nav.settings, icon: <SettingsOutlinedIcon /> })}
      </nav>

      <div className={styles.footer}>
        <RoleSelector />
        <p className={styles.footnote}>
          {t.app.tagline} · {t.app.course}
        </p>
      </div>
    </div>
  );
}
