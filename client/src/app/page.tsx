"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CrudGrid from "@/app/CrudGrid";
import { Box } from "@mui/system";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Box sx={{ height: 500 }}>
        <CrudGrid />
      </Box>
    </QueryClientProvider>
  );
}
