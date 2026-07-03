"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PlaceIcon from "@mui/icons-material/Place";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";

export interface RoleCard {
  label: string;
  headline: string;
  sub: string;
  href: string;
  image: string;
}

// Horizontal, swipeable rail of role-category cards. Each card advertises one niche
// ("Apply for chef roles today") and deep-links into the feed filtered to that role.
// Scroll-snap gives native swipe on touch; the dots track and jump between cards.
export default function RoleCarousel({ roles }: { roles: RoleCard[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function slideWidth(): number {
    const el = scroller.current;
    const first = el?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + 16 : 1; // 16px = gap
  }

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / slideWidth()));
  }

  function goTo(i: number) {
    scroller.current?.scrollTo({ left: i * slideWidth(), behavior: "smooth" });
  }

  return (
    <Box>
      <Box
        ref={scroller}
        onScroll={onScroll}
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {roles.map((role) => (
          <Box
            key={role.href}
            component="a"
            href={role.href}
            sx={{
              scrollSnapAlign: "start",
              flex: "0 0 84%",
              textDecoration: "none",
              position: "relative",
              height: { xs: 196, sm: 216 },
              borderRadius: 5,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundImage: `linear-gradient(180deg, rgba(35,35,37,0.12) 0%, rgba(35,35,37,0.18) 42%, rgba(35,35,37,0.92) 100%), url(${role.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "block",
              transition: "transform 0.2s ease",
              "&:active": { transform: "scale(0.99)" },
            }}
          >
            {/* Category chip */}
            <Box
              sx={{
                position: "absolute",
                top: 14,
                left: 14,
                px: 1.3,
                py: 0.5,
                borderRadius: 999,
                border: `1px solid ${brand.teal}`,
                bgcolor: "rgba(35,35,37,0.4)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              <Typography sx={{ color: brand.tealBright, fontWeight: 800, fontSize: "0.66rem", letterSpacing: "0.14em" }}>
                {role.label}
              </Typography>
            </Box>

            {/* Bottom content: headline + location, then an explicit "View roles" link
                so it never reads as a carousel next-button. */}
            <Box sx={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
              <Typography
                sx={{
                  fontFamily: display.style.fontFamily,
                  color: "#fff",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontSize: "1.24rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {role.headline}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.75 }}>
                <PlaceIcon sx={{ color: brand.tealBright, fontSize: "0.95rem" }} />
                <Typography sx={{ color: "rgba(255,255,255,0.82)", fontWeight: 500, fontSize: "0.8rem" }}>
                  {role.sub}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={0.6}
                sx={{ mt: 1.25, display: "inline-flex", alignItems: "center" }}
              >
                <Typography sx={{ color: brand.tealBright, fontWeight: 800, fontSize: "0.9rem" }}>
                  View roles
                </Typography>
                <ArrowForwardIcon sx={{ color: brand.tealBright, fontSize: "1.05rem" }} />
              </Stack>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Progress dots — active dot stretches into a pill */}
      <Stack direction="row" spacing={0.75} sx={{ justifyContent: "center", mt: 2 }}>
        {roles.map((role, i) => (
          <Box
            key={role.href}
            component="button"
            onClick={() => goTo(i)}
            aria-label={`Show ${role.label} card`}
            sx={{
              p: 0,
              border: 0,
              cursor: "pointer",
              height: 7,
              width: active === i ? 22 : 7,
              borderRadius: 999,
              bgcolor: active === i ? brand.teal : "rgba(255,255,255,0.28)",
              transition: "width 0.25s ease, background-color 0.25s ease",
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
