"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import { signOut } from "@/app/actions/auth";
import type { Role } from "@/lib/types";

// Compact overflow menu for the landing top bar. Real routes, no dead links. Auth-aware:
// shows Log in / Sign up when signed out, and Log out (+ area links) when signed in.
export default function LandingMenu({ role = null }: { role?: Role | null }) {
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
        <MenuItem
          component="a"
          href={role === "recruiter" ? "/recruiter" : "/signup?type=business"}
          onClick={close}
        >
          {role === "recruiter" ? "Recruiter dashboard" : "Post a job"}
        </MenuItem>
        {role === "candidate" && (
          <MenuItem component="a" href="/profile" onClick={close}>My profile</MenuItem>
        )}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
        {role && (
          <MenuItem
            onClick={() => {
              close();
              void signOut();
            }}
          >
            Log out
          </MenuItem>
        )}
        {!role && <MenuItem component="a" href="/login" onClick={close}>Log in</MenuItem>}
        {!role && <MenuItem component="a" href="/signup" onClick={close}>Sign up</MenuItem>}
      </Menu>
    </>
  );
}
