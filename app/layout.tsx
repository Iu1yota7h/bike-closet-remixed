import type {Metadata} from 'next';
import './globals.css';
const title='Bike Closet Remixed — in-stock cycling deals';
const description='Find in-stock Bike Closet cycling deals by size, product type and price. Free independent catalog with exact retailer details and sourced product notes.';
export const metadata:Metadata={title,description,verification:{other:{"msvalidate.01":"F79D008E6F890C2E941EBF7FF4A8002D"}},alternates:process.env.SITE_URL?{canonical:new URL('/',process.env.SITE_URL).href}:undefined,openGraph:{title,description,type:'website',siteName:'Bike Closet Remixed'},twitter:{card:'summary',title,description}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
