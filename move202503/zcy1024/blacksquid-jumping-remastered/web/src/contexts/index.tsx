'use client'

import {ReactNode} from "react";
import UserContextProvider, {UserContext} from "@/contexts/userContext";

export {
    UserContext
}

export default function CustomContextProvider({children}: {children: ReactNode}) {
    return (
        <UserContextProvider>
            {children}
        </UserContextProvider>
    );
}