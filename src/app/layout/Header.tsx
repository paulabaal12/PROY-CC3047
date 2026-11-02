import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import {
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PersonAvatar } from '@/components';
import { t } from '@/config/texts';
import { useRole, useSupabaseSession } from '@/features/auth';
import { useSettings } from '@/hooks';
import styles from './Header.module.scss';

const SECTIONS: [RegExp, string][] = [
  [/^\/tickets\/new/, t.nav.newTicket],
  [/^\/tickets\/.+/, 'Ticket'],
  [/^\/tickets/, t.nav.myTickets],
  [/^\/catalog/, t.nav.catalog],
  [/^\/board/, t.nav.board],
  [/^\/problems/, t.nav.problems],
  [/^\/dashboard/, t.nav.dashboard],
  [/^\/settings/, t.nav.settings],
];

export function Header({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { roleDef } = useRole();
  const { configured, session, signOut } = useSupabaseSession();
  const { settings, updateSettings } = useSettings();
  const [query, setQuery] = useState('');
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const dark = settings.themeMode === 'dark';
  const section = SECTIONS.find(([re]) => re.test(pathname))?.[1];

  // Signed in: show the real account; demo mode: the simulated persona.
  const email = session?.user.email;
  const displayName = email ? (email.split('@')[0] ?? email) : roleDef.persona.name;
  const subtitle = email ?? roleDef.persona.email;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/tickets?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className={styles.header}>
      <IconButton className={styles.menu} onClick={onMenu} aria-label={t.header.menu}>
        <MenuIcon fontSize="small" />
      </IconButton>
      <p className={styles.context}>
        <span>{t.app.service}</span>
        {section && (
          <>
            <span className={styles.sep}>/</span>
            <strong>{section}</strong>
          </>
        )}
      </p>
      <form className={styles.search} onSubmit={submit} role="search">
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tickets…"
          slotProps={{
            htmlInput: { 'aria-label': t.header.search },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </form>
      <Tooltip title={dark ? 'Modo día' : 'Modo noche'}>
        <IconButton
          onClick={() => updateSettings({ themeMode: dark ? 'light' : 'dark' })}
          aria-label={dark ? 'Activar modo día' : 'Activar modo noche'}
        >
          {dark ? (
            <LightModeOutlinedIcon fontSize="small" />
          ) : (
            <DarkModeOutlinedIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <button
        type="button"
        className={styles.account}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-label="Cuenta"
      >
        <PersonAvatar name={displayName} role={roleDef.id} size={28} />
        <span className={styles.accountText}>
          <strong>{displayName}</strong>
          <span>{roleDef.short}</span>
        </span>
        <KeyboardArrowDownIcon className={styles.chevron} fontSize="small" />
      </button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 240 } } }}
      >
        <div className={styles.menuHead}>
          <strong>{displayName}</strong>
          <span>{subtitle}</span>
          <span className={styles.menuRole}>{roleDef.name}</span>
        </div>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            navigate('/settings');
          }}
        >
          {t.nav.settings}
        </MenuItem>
        {configured && session && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              signOut();
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Cerrar sesión
          </MenuItem>
        )}
      </Menu>
    </header>
  );
}
