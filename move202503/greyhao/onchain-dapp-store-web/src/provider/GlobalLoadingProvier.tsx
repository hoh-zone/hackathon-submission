"use client";
import { FullScreenLoader } from "@/components/full-screen-loader";
import { createContext, useContext, useState } from "react";

const LoadingContext = createContext({
  isLoading: false,
  setLoading: (v: boolean) => {
    console.log("loading is ", v);
  },
});

export const useGlobalLoading = () => useContext(LoadingContext);

export function GlobalLodingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
      {isLoading && <FullScreenLoader />}
    </LoadingContext.Provider>
  );
}