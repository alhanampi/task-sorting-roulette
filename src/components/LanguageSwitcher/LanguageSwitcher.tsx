import { ToggleButton, ToggleButtonGroup } from '@mui/material'

type Language = 'en' | 'es' | 'pt'

interface LanguageOption {
  code: Language
  label: string
}

interface LanguageSwitcherProps {
  language: Language
  onChange: (language: Language) => void
  options: readonly LanguageOption[]
  label?: string
}

export default function LanguageSwitcher({ language, onChange, options }: LanguageSwitcherProps) {
  return (
    <ToggleButtonGroup
      value={language}
      exclusive
      size="small"
      onChange={(_, v: Language | null) => {
        if (v !== null) onChange(v)
      }}
    >
      {options.map(option => (
        <ToggleButton key={option.code} value={option.code}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
