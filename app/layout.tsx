import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Bike Closet Index — in-stock cycling deals',description:'Independent, filterable Bike Closet catalog with exact variants and sourced product notes.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
