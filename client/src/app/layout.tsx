import type { Metadata } from "next";
import React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { AppBar, CssBaseline, Toolbar, Typography } from "@mui/material";
import { Box } from "@mui/system";

export const metadata: Metadata = {
  title: "Todo Real World App",
  description: "End-to-end Test Monorepo Example",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CssBaseline />
        <AppRouterCacheProvider>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6">Todo Real World App</Typography>
            </Toolbar>
          </AppBar>
          <Box component="main" padding={2}>
            {children}
          </Box>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
