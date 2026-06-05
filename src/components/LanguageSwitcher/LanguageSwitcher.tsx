import { FormControl, MenuItem, Select } from '@mui/material'
import { ILanguageSwitcherProps } from '../../utils/interfaces'
import { Language } from '../../utils/types'

export default function LanguageSwitcher({ language, onChange, options }: ILanguageSwitcherProps) {
  return (
    <FormControl size="small">
      <Select
        value={language}
        onChange={(e) => onChange(e.target.value as Language)}
        sx={{ minWidth: 80 }}
      >
        {options.map(option => (
          <MenuItem key={option.code} value={option.code}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
