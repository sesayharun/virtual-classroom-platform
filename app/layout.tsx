import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Virtual Classroom Platform",description:"Role-based virtual learning for classes, assignments, materials, attendance and discussions.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
