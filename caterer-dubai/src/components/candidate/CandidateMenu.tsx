"use client";

import { useState } from "react";
import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import { signOut } from "@/app/actions/auth";

const LINKS = [
  { href: "/jobs", label: "Jobs", icon: <WorkOutlineIcon fontSize="small" /> },
  { href: "/profile", label: "Profile", icon: <PersonOutlineIcon fontSize="small" /> },
  { href: "/alerts", label: "Alerts", icon: <NotificationsNoneIcon fontSize="small" /> },
];

// Hamburger menu for the candidate top bar: navigation + log out, replacing the
// standalone alerts bell and the per-page "Jobs / Log out" toolbar.
export default function CandidateMenu() {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        aria-label="menu"
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color: "#fff" }}
      >
        <MenuIcon />
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 208, borderRadius: 2, border: "1px solid rgba(255,255,255,0.10)" } } }}
      >
        {LINKS.map((l) => (
          <MenuItem key={l.href} component={Link} href={l.href} prefetch onClick={close} sx={{ py: 1.15 }}>
            <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)" }}>{l.icon}</ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontWeight: 700 } } }}>{l.label}</ListItemText>
          </MenuItem>
        ))}

        <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

        <Box component="form" action={signOut}>
          <MenuItem component="button" type="submit" sx={{ width: "100%", py: 1.15, justifyContent: "flex-start", textAlign: "left" }}>
            <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)" }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontWeight: 700 } } }}>Log out</ListItemText>
          </MenuItem>
        </Box>
      </Menu>
    </>
  );
}
