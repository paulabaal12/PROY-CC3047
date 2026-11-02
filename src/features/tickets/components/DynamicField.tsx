import AttachFileIcon from '@mui/icons-material/AttachFile';
import {
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { countryName, findStudio, gamesOfStudio, GAMES, STUDIOS } from '@/config/catalogReference';
import { NEW_STUDIO, type FieldDef } from '@/config/services';
import type { DetailValue, TicketDetails } from '@/types';

interface Props {
  field: FieldDef;
  value: DetailValue | undefined;
  details: TicketDetails;
  error?: string;
  onChange: (value: DetailValue) => void;
}

interface Option {
  value: string;
  label: string;
  group?: string;
}

const studioOptions = (allowNew: boolean): Option[] => [
  ...(allowNew
    ? [{ value: NEW_STUDIO, label: 'Nuevo estudio (no está en el catálogo)', group: 'Nuevo' }]
    : []),
  ...STUDIOS.map((s) => ({ value: s.id, label: s.name, group: countryName(s.country) })),
];

const gameOptions = (studioId?: string): Option[] =>
  (studioId && findStudio(studioId) ? gamesOfStudio(studioId) : GAMES).map((g) => ({
    value: g.slug,
    label: g.name,
  }));

/** Renders one category-specific field from config/services. */
export function DynamicField({ field, value, details, error, onChange }: Props) {
  const str = typeof value === 'string' ? value : '';
  const arr = Array.isArray(value) ? value : [];
  const label = `${field.label}${field.required ? ' *' : ''}`;
  const helper = error ?? field.helper;

  if (field.kind === 'studio' || field.kind === 'game') {
    const options =
      field.kind === 'studio'
        ? studioOptions(Boolean(field.allowNew))
        : gameOptions(typeof details.estudio === 'string' ? details.estudio : undefined);
    const selected = options.find((o) => o.value === str) ?? null;
    return (
      <Autocomplete
        options={options}
        value={selected}
        groupBy={(o) => o.group ?? ''}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        onChange={(_, o) => onChange(o?.value ?? '')}
        noOptionsText="Sin coincidencias en el catálogo"
        renderInput={(params) => (
          <TextField {...params} label={label} error={Boolean(error)} helperText={helper} />
        )}
      />
    );
  }

  if (field.kind === 'select') {
    return (
      <TextField
        select
        fullWidth
        label={label}
        value={str}
        onChange={(e) => onChange(e.target.value)}
        error={Boolean(error)}
        helperText={helper}
      >
        {field.options?.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.kind === 'multiselect') {
    const options = field.options ?? [];
    // Short lists read better as checkboxes; long ones (platforms) as an autocomplete.
    if (options.length <= 6) {
      return (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <FormLabel component="legend" error={Boolean(error)} sx={{ fontWeight: 600, mb: 0.5 }}>
            {label}
          </FormLabel>
          <FormGroup row>
            {options.map((o) => (
              <FormControlLabel
                key={o.value}
                label={o.label}
                control={
                  <Checkbox
                    checked={arr.includes(o.value)}
                    onChange={(e) =>
                      onChange(
                        e.target.checked ? [...arr, o.value] : arr.filter((v) => v !== o.value),
                      )
                    }
                  />
                }
              />
            ))}
          </FormGroup>
          {helper && <FormHelperText error={Boolean(error)}>{helper}</FormHelperText>}
        </fieldset>
      );
    }
    return (
      <Autocomplete
        multiple
        options={options.map((o) => o.value)}
        value={arr}
        onChange={(_, v) => onChange(v)}
        renderTags={(tags, getTagProps) =>
          tags.map((tag, index) => {
            const { key, ...rest } = getTagProps({ index });
            return <Chip key={key} {...rest} label={tag} size="small" />;
          })
        }
        renderInput={(params) => (
          <TextField {...params} label={label} error={Boolean(error)} helperText={helper} />
        )}
      />
    );
  }

  if (field.kind === 'file') {
    return (
      <Stack gap={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'center' }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<AttachFileIcon />}
            sx={{ whiteSpace: 'nowrap', flex: 'none' }}
          >
            Adjuntar archivo
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
            />
          </Button>
          <TextField
            fullWidth
            size="small"
            label={`${label} — o pega un enlace`}
            value={str}
            onChange={(e) => onChange(e.target.value)}
            error={Boolean(error)}
          />
        </Stack>
        {helper && <FormHelperText error={Boolean(error)}>{helper}</FormHelperText>}
      </Stack>
    );
  }

  return (
    <TextField
      fullWidth
      label={label}
      value={str}
      onChange={(e) => onChange(e.target.value)}
      error={Boolean(error)}
      helperText={helper}
      placeholder={field.placeholder}
      multiline={field.kind === 'textarea'}
      minRows={field.kind === 'textarea' ? 3 : undefined}
      type={
        field.kind === 'number'
          ? 'number'
          : field.kind === 'datetime'
            ? 'datetime-local'
            : field.kind === 'url'
              ? 'url'
              : 'text'
      }
      slotProps={field.kind === 'datetime' ? { inputLabel: { shrink: true } } : undefined}
    />
  );
}
