"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { toggleFavorite } from "@/actions/favorites"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"


interface FavoritesContextType {
    favorites: string[]
    toggle: (productId: string) => Promise<void>
    isFavorite: (productId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({
    children,
    initialFavorites = [],
}: {
    children: ReactNode
    initialFavorites?: string[]
}) {
    const [favorites, setFavorites] = useState<string[]>(initialFavorites)
    const router = useRouter()
    const { data: session } = useSession()

    // Update local state when initialFavorites prop changes (e.g. from router.refresh())
    useEffect(() => {
        setFavorites(initialFavorites)
    }, [initialFavorites])

    const toggle = async (productId: string) => {
        if (!session) {
            router.push("/login")
            return
        }

        const isFav = favorites.includes(productId)

        // Optimistic update
        setFavorites(prev =>
            isFav ? prev.filter(id => id !== productId) : [...prev, productId]
        )

        try {
            await toggleFavorite(productId)
            router.refresh()
        } catch (error) {
            // Revert on error
            setFavorites(prev =>
                isFav ? [...prev, productId] : prev.filter(id => id !== productId)
            )
            console.error(error)
        }
    }

    const isFavorite = (productId: string) => favorites.includes(productId)

    return (
        <FavoritesContext.Provider value={{ favorites, toggle, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export function useFavorites() {
    const context = useContext(FavoritesContext)
    if (context === undefined) {
        throw new Error("useFavorites must be used within a FavoritesProvider")
    }
    return context
}
