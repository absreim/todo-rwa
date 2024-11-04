import PageContainer from "@/app/PageContainer";
import { unstable_noStore as noStore } from "next/cache"

export default function Home() {
  noStore();
  const value = process.env.API_URL!
  
  return (
    <PageContainer apiUrl={value} />
  );
}
