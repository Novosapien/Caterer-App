"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";

// Compact overflow menu for the landing top bar. Real routes, no dead links.
export default function LandingMenu() {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Open menu"
        sx={{
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.18)",
          width: 40,
          height: 40,
          "&:hover": { borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.05)" },
        }}
      >
        <MenuIcon sx={{ fontSize: "1.25rem" }} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 200,
              bgcolor: "#1A1A1C",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundImage: "none",
              "& .MuiMenuItem-root": { fontWeight: 600, py: 1.1 },
              "& .MuiMenuItem-root:hover": { bgcolor: "rgba(255,255,255,0.06)" },
            },
          },
        }}
      >
        <MenuItem component="a" href="/jobs" onClick={close}>Find a job</MenuItem>
        <MenuItem component="a" href="/recruiter" onClick={close}>Post a job</MenuItem>
        <MenuItem component="a" href="/profile" onClick={close}>My profile</MenuItem>
      </Menu>
    </>
  );
}
