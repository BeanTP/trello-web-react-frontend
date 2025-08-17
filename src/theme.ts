import { cyan, deepOrange, orange, teal } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  trello: {
    appBarHeight: "48px",
    broadBarHeight: "58px",
  },
  colorSchemes: {
    light: {
      palette: {
        primary: teal,
        secondary: deepOrange,
      },
    },
    dark: {
      palette: {
        primary: cyan,
        secondary: orange,
      },
    },
  },
});

export default theme;
