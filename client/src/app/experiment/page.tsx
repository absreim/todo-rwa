"use client"

import { useEffect, useState } from "react";
import { Typography } from "@mui/material";

export default function Experiment() {
  const [key, setKey] = useState<string>("before");

  useEffect(() => {
    setTimeout(() => setKey("after"), 1000)
  }, []);
  
  return (
    <Typography key={key}>
      {key}
    </Typography>
  )
}
