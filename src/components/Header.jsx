// src/components/Header.jsx
import React, { useState } from "react";
import axios from "axios";
import {
  AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemText, Box, useTheme, useMediaQuery
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Inicio", path: "/home" },
  { label: "Juegos", path: "/games" },
  { label: "Dashboard", path: "/dashboard" }
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  // Simulación de autenticación (reemplaza por tu lógica real)
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await axios.put('http://localhost:5000/sessions/end', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("neurogames_token")}` }
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      logout();        // Limpia el estado y localStorage
      navigate("/home"); // Redirige al Home
    }
  };

  const ctaButton = isAuthenticated ? (
    <Button
      color="secondary"
      variant="contained"
      onClick={handleLogout}
      sx={{ ml: 2 }}
    >
      Cerrar sesión
    </Button>
  ) : (
    <>
      <Button color="secondary" variant="outlined" component={Link} to="/login" sx={{ ml: 2 }}>
        Iniciar sesión
      </Button>
      <Button color="secondary" variant="contained" component={Link} to="/register" sx={{ ml: 2 }}>
        Registrarse
      </Button>
    </>
  );

  return (
    <AppBar position="sticky" color="primary" elevation={3}>
      <Toolbar>
        {/* Logo y nombre */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="logo"
          component={Link}
          to="/home"
          sx={{ mr: 2 }}
        >
          <SportsEsportsIcon />
        </IconButton>
        <Typography
          variant="h6"
          component={Link}
          to="/home"
          sx={{
            flexGrow: 1,
            textDecoration: "none",
            color: "inherit",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          NeuroSite
        </Typography>

        {/* Menú para escritorio */}
        {!isMobile && (
          <>
            {navLinks.map((link) => (
              <Button
                key={link.label}
                color="inherit"
                component={Link}
                to={link.path}
                sx={{
                  mx: 1,
                  fontWeight: 500,
                  textTransform: "none",
                  "&.active": { borderBottom: "2px solid #fff" }
                }}
              >
                {link.label}
              </Button>
            ))}
            {ctaButton}
          </>
        )}

        {/* Menú hamburguesa para móvil */}
        {isMobile && (
          <>
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <Box
                sx={{ width: 220 }}
                role="presentation"
                onClick={() => setDrawerOpen(false)}
              >
                <List>
                  {navLinks.map((link) => (
                    <ListItem key={link.label} disablePadding>
                      <ListItemButton component={Link} to={link.path}>
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  <ListItem>
                    {ctaButton}
                  </ListItem>
                </List>
              </Box>
            </Drawer>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
