import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <Box sx={{ textAlign: "center", py: 8, px: 3, opacity: 0.85 }}>
      {icon && <Box sx={{ fontSize: 48, mb: 1 }}>{icon}</Box>}
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
