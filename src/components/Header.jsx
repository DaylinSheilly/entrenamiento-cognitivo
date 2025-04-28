import React, { useState } from "react";
import axios from "axios";
import {
  AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemText, Box, useTheme, useMediaQuery, Avatar, Tooltip, Menu, MenuItem, ListItemIcon, Divider
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Inicio", path: "/home" },
  { label: "Juegos", path: "/games" },
  { label: "Dashboard", path: "/dashboard" }
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  // --- User Menu Handlers ---
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      await axios.put('http://localhost:5000/sessions/end', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("neurogames_token")}` }
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      logout();
      navigate("/home");
      handleMenuClose();
    }
  };

  const handleProfile = () => {
    navigate("/usuario");
    handleMenuClose();
  };

  // --- Avatar content ---
  const getAvatarContent = () => {
    if (user?.nombre_usuario) {
      // Iniciales del usuario
      const parts = user.nombre_usuario.trim().split(" ");
      const initials = parts.length === 1
        ? parts[0][0]
        : (parts[0][0] + parts[parts.length - 1][0]);
      return initials.toUpperCase();
    }
    return <AccountCircleIcon />;
  };

  const userMenu = (
    <>
      <Tooltip title="Opciones de usuario">
        <IconButton
          onClick={handleMenuOpen}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={Boolean(anchorEl) ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl) ? "true" : undefined}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: "secondary.main", color: "white" }}>
            {getAvatarContent()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 1.5,
            minWidth: 180,
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.18))",
            '& .MuiAvatar-root': {
              width: 28,
              height: 28,
              ml: -0.5,
              mr: 1,
            },
          }
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Usuario
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </>
  );

  const ctaButton = isAuthenticated ? (
    userMenu
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
