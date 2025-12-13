export default function PrintLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body className="bg-white">
                {children}
            </body>
        </html>
    )
}
