import { ClerkProvider } from "@clerk/clerk-react";
import { Provider } from "react-redux";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { store } from "./store/store";
import HomeScreen from "./pages/HomePage";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#38bdf8" },
    background: { default: "#0f172a", paper: "#1e293b" },
    text: { primary: "#e2e8f0", secondary: "#94a3b8" },
  },
});

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <HomeScreen /> {/* pages/HomePage.tsx */}
        </ThemeProvider>
      </Provider>
    </ClerkProvider>
  );
}
