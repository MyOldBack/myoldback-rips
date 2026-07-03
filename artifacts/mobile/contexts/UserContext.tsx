import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface UserContextValue {
  userName: string | null;
  isAdmin: boolean;
  setUserName: (name: string) => Promise<void>;
  setIsAdmin: (v: boolean) => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  userName: null,
  isAdmin: false,
  setUserName: async () => {},
  setIsAdmin: async () => {},
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isAdmin, setIsAdminState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(["@userName", "@isAdmin"]).then(([nameEntry, adminEntry]) => {
      if (nameEntry[1]) setUserNameState(nameEntry[1]);
      if (adminEntry[1] === "true") setIsAdminState(true);
      setLoading(false);
    });
  }, []);

  const setUserName = async (name: string) => {
    await AsyncStorage.setItem("@userName", name);
    setUserNameState(name);
  };

  const setIsAdmin = async (v: boolean) => {
    await AsyncStorage.setItem("@isAdmin", v ? "true" : "false");
    setIsAdminState(v);
  };

  return (
    <UserContext.Provider value={{ userName, isAdmin, setUserName, setIsAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
