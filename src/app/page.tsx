import { Suspense } from "react";
import { Login } from "@/components/Login";

export default function Home() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
