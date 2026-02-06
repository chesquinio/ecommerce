"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleFavorite(productId: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Debes iniciar sesión para agregar a favoritos")
    }

    const userId = session.user.id

    try {
        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        })

        if (existingFavorite) {
            await prisma.favorite.delete({
                where: {
                    id: existingFavorite.id,
                },
            })
            revalidatePath("/profile/favorites")
            revalidatePath("/products")
            return { added: false }
        } else {
            await prisma.favorite.create({
                data: {
                    userId,
                    productId,
                },
            })
            revalidatePath("/profile/favorites")
            revalidatePath("/products")
            return { added: true }
        }
    } catch (error) {
        console.error("Error toggling favorite:", error)
        throw new Error("Error al actualizar favoritos")
    }
}


export async function getFavoriteProducts() {
    const session = await auth()

    if (!session?.user?.id) {
        return []
    }

    try {
        const favorites = await prisma.favorite.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                product: {
                    include: {
                        category: true,
                        brand: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return favorites.map(f => f.product)
    } catch (error) {
        console.error("Error fetching favorite products:", error)
        return []
    }
}

export async function getFavorites() {
    const session = await auth()

    if (!session?.user?.id) {
        return []
    }

    try {
        const favorites = await prisma.favorite.findMany({
            where: {
                userId: session.user.id,
            },
            select: {
                productId: true
            }
        })

        return favorites.map(f => f.productId)
    } catch (error) {
        console.error("Error fetching favorites:", error)
        return []
    }
}
