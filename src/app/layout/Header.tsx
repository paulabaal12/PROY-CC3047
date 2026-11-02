import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PersonAvatar } from '@/components';
import { t } from '@/config/texts';
import { useRole } from '@/features/auth';
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
  const { settings, updateSettings } = useSettings();
  const [query, setQuery] = useState('');
  const dark = settings.themeMode === 'dark';
  const section = SECTIONS.find(([re]) => re.test(pathname))?.[1];

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
      <Tooltip title={`${roleDef.persona.name} · ${roleDef.name}`}>
        <span className={styles.avatar}>
          <PersonAvatar name={roleDef.persona.name} role={roleDef.id} size={32} />
        </span>
      </Tooltip>
    </header>
  );
}
