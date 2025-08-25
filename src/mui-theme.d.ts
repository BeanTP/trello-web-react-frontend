// src/types/mui-theme.d.ts
import "@mui/material/styles";

// Khai báo mở rộng cho MUI Theme
declare module "@mui/material/styles" {
  interface Theme {
    trello: {
      appBarHeight: string;
      boardBarHeight: string;
      boardContentHeight: string;
    };
  }
  // Cho phép truyền vào khi createTheme(...)
  interface ThemeOptions {
    trello?: {
      appBarHeight?: string;
      boardBarHeight?: string;
      boardContentHeight?: string;
    };
  }
}
