import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import { IconButton, Tooltip } from '@mui/material';
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

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Portal',
    items: [
      { to: '/tickets/new', label: t.nav.newTicket, icon: <AddCircleOutlineIcon /> },
      { to: '/tickets', label: t.nav.myTickets, icon: <ListAltOutlinedIcon /> },
      { to: '/catalog', label: t.nav.catalog, icon: <MenuBookOutlinedIcon /> },
    ],
  },
  {
    label: 'Soporte',
    items: [
      { to: '/board', label: t.nav.board, icon: <ViewKanbanOutlinedIcon />, internal: true },
      { to: '/problems', label: t.nav.problems, icon: <BugReportOutlinedIcon />, internal: true },
      { to: '/dashboard', label: t.nav.dashboard, icon: <InsightsOutlinedIcon />, internal: true },
    ],
  },
  {
    label: 'Cuenta',
    items: [{ to: '/settings', label: t.nav.settings, icon: <SettingsOutlinedIcon /> }],
  },
];

interface Props {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, onNavigate }: Props) {
  const { isInternal } = useRole();

  const renderItem = (item: NavItem) => {
    const locked = item.internal && !isInternal;
    const tip = collapsed ? item.label : locked ? t.nav.internalOnly : '';
    const link = (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/tickets'}
        onClick={onNavigate}
        aria-label={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          clsx(styles.link, isActive && styles.active, locked && styles.locked)
        }
      >
        <span className={styles.icon}>{item.icon}</span>
        {!collapsed && <span className={styles.label}>{item.label}</span>}
        {!collapsed && locked && (
          <LockOutlinedIcon className={styles.lock} aria-label={t.nav.internalOnly} />
        )}
      </NavLink>
    );
    // Tooltip would overwrite NavLink's function className, so it wraps a span instead.
    return tip ? (
      <Tooltip key={item.to} title={tip} placement="right">
        <span className={styles.tipWrap}>{link}</span>
      </Tooltip>
    ) : (
      link
    );
  };

  return (
    <div className={clsx(styles.sidebar, collapsed && styles.collapsed)}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>
          <span className={styles.logoDot} />
        </span>
        {!collapsed && (
          <div className={styles.brandText}>
            <p className={styles.name}>{t.app.name}</p>
            <p className={styles.service}>{t.app.service}</p>
          </div>
        )}
      </div>

      <nav className={styles.nav} aria-label="Navegación principal">
        {GROUPS.map((g) => (
          <div key={g.label} className={styles.group}>
            {collapsed ? (
              <hr className={styles.divider} />
            ) : (
              <p className={styles.groupLabel}>{g.label}</p>
            )}
            {g.items.map(renderItem)}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <RoleSelector compact={collapsed} />
        {onToggle && (
          <Tooltip title={collapsed ? 'Expandir menú' : 'Contraer menú'} placement="right">
            <IconButton
              onClick={onToggle}
              className={styles.toggle}
              aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              {collapsed ? (
                <KeyboardDoubleArrowRightIcon fontSize="small" />
              ) : (
                <KeyboardDoubleArrowLeftIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
