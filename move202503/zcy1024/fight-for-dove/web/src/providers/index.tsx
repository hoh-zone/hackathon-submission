'use client'

import SuiProvider from "@/providers/suiProvider";
import {ReactNode} from "react";

export default function CustomProvider({children}: {children: ReactNode}) {
    return (
        <SuiProvider>
            {children}
        </SuiProvider>
    );
}