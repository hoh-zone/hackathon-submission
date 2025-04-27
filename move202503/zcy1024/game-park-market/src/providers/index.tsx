import SuiProvider from "@/providers/suiProvider";
import ReduxProvider from "@/providers/redux";
import {ReactNode} from "react";

export default function CustomProvider({children}: {children: ReactNode}) {
    return (
        <SuiProvider>
            <ReduxProvider>
                {children}
            </ReduxProvider>
        </SuiProvider>
    );
}