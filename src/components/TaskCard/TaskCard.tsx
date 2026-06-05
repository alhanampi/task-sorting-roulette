import { Box, Card, CardContent, Chip, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ITaskCardProps } from '../../utils/interfaces'

function getDifficultyColor(difficulty: number): 'success' | 'info' | 'error' {
  if (difficulty <= 2) return 'success'
  if (difficulty === 3) return 'info'
  return 'error'
}

export default function TaskCard({
  title,
  difficulty,
  status,
  isSelected,
}: ITaskCardProps) {
  const { t } = useTranslation()

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: isSelected ? 'primary.main' : 'divider',
        bgcolor: isSelected ? 'rgba(56, 189, 248, 0.06)' : 'background.paper',
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="body2" fontWeight={500} sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Chip
            label={`${t('scoreAbbr')} ${difficulty}`}
            size="small"
            color={getDifficultyColor(difficulty)}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {status}
        </Typography>
      </CardContent>
    </Card>
  )
}
