"use client";

import { createContext, useContext, useState } from "react";

const LoaderContext = createContext<{
  loaderDone: boolean;
  setLoaderDone: (v: boolean) => void;
}>({ loaderDone: false, setLoaderDone: () => {} });

export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  const [loaderDone, setLoaderDone] = useState(false);
  return (
    <LoaderContext.Provider value={{ loaderDone, setLoaderDone }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
