// import { cyan, deepOrange, orange, teal } from '@mui/material/colors';
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  trello: {
    appBarHeight: "58px",
    broadBarHeight: "60px",
  },
  colorSchemes: {
    light: {},
    dark: {},
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          "*::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: "#dcdde1",
            borderRadius: "8px",
          },
          "*::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "white",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderWidth: "0.5px",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: "0.875rem" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          "& fieldSet": { borderWidth: "0.5px !important" },
          "&:hover fieldSet": { borderWidth: "1px !important" },
          "&.Mui-focused fieldSet": { borderWidth: "1px !important" },
        },
      },
    },
  },
});

export default theme;
