"use client";
import "./globals.css";

export default function RootLayout({ children }: { children: any }) {
    return (
        <html>
        <head>
            <title>Open LMS</title>
            <meta name="description" content="Training course hosting for Queen's University"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <link rel="icon" href="/openlms.png"/>
        </head>
        <body>
            {children}
        </body>
        </html>
    );
}
