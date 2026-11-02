import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonAvatar } from '@/components';
import { t } from '@/config/texts';
import { useRole } from '@/features/auth';
import { useSettings } from '@/hooks';
import styles from './Header.module.scss';

export function Header({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const { roleDef } = useRole();
  const { settings, updateSettings } = useSettings();
  const [query, setQuery] = useState('');
  const dark = settings.themeMode === 'dark';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/tickets?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className={styles.header}>
      <IconButton className={styles.menu} onClick={onMenu} aria-label={t.header.menu}>
        <MenuIcon />
      </IconButton>
      <form className={styles.search} onSubmit={submit} role="search">
        <TextField
          size="small"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.header.search}
          slotProps={{
            htmlInput: { 'aria-label': t.header.search },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
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
          {dark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title={`${roleDef.persona.name} · ${roleDef.name}`}>
        <div className={styles.user}>
          <PersonAvatar name={roleDef.persona.name} role={roleDef.id} />
          <div className={styles.userText}>
            <strong>{roleDef.persona.name}</strong>
            <span>{roleDef.short}</span>
          </div>
        </div>
      </Tooltip>
    </header>
  );
}
